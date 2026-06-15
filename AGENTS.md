# AGENTS.md — how to work in this repository

This file tells the next AI coding agent (Claude Code or other) **how** to work
here. It encodes the working methodology this project was actually built and
hardened with. **Read it fully before you start.**

The global `~/.claude/CLAUDE.md` conventions still apply (Milestones tracking,
`.claude/` holds only symlinks, never commit real business data, stay inside the
project dir). This file adds the *working style*.

---

## The one rule that overrides the default

**Optimize for the most accurate, correct result — never for inference speed or
fewer steps.** Take the time. Don't take shortcuts. Don't guess. Not a prototype,
not a demo — a finished, verified thing.

This project was built by working *deeply*: form a hypothesis, then prove or
disprove it with real measurement, verify every change against the real running
artifact, and only then ship. **Default to that mode here.** Be brief in
conversation; be exhaustive in the work. For anything substantial (a feature, a
perf investigation, a refactor, a review) it is always better to spend many steps
and tokens getting it right than to produce a fast, plausible, unverified answer.

---

## Core methodology (what we actually did)

### 1. Measure, don't guess — and let data overturn your hypothesis
Your first explanation is frequently wrong. Here, measurement repeatedly
*invalidated* a confident hypothesis:
- "The watercolor SVG filter re-rasterizes every frame" → A/B profiling showed it
  was **already cached**. The real mobile-overheating cause was 66 `.heart-pollen`
  circles animating `opacity`, forcing a full re-raster of the flower each frame.
- "The per-petal shiver forces the grouped filter to re-raster" → removing the
  filter changed nothing; the shiver and a separate **meadow main-thread loop**
  were the residual costs.

So: hypothesis → **instrument and measure** (Chrome traces via Playwright + CDP
`Performance.getMetrics`; A/B by toggling each suspect) → rank causes by evidence
→ fix the dominant one → **re-measure to prove the reduction**. Say so plainly
when the data overturns you.

### 2. Verify against the real artifact, not "it should work"
- A green `npm run build` is the floor, not the proof.
- Run it, exercise the **full flow** end-to-end, check **0 console errors**.
- Take screenshots and actually *look* — this caught a too-faint shadow, an
  invisible CTA mid-animation, a hard-edged mobile ellipse.
- Verify the **live deployed URL** (HTTP status + `<title>` + served bundle hash +
  a headless screenshot), not just localhost.
- Confirm prod serves the **exact hash** you verified.

### 3. Root cause over symptom
Find the real mechanism before fixing. Examples from this repo:
- Mobile "green ellipse": `filter: blur()` in CSS **does not render on SVG *child*
  elements on mobile** → replaced with a radial-gradient fill.
- Flower "teleports" on wake: the idle's time-based clock kept advancing while
  rendering was paused → **freeze the clock during rest, rebase `t0` on resume**.
Patch the cause, not the appearance.

### 4. Adversarially verify; use multi-agent workflows for substantial work
For design, review and audits: fan out, then **verify each finding adversarially**
(a skeptic re-reads the real code). This repo used a 3-lens creative design panel
→ one "bible"; a 5-dimension adversarial code review (every finding verified); a
5-agent thermal audit. Don't trust a finding — even your own — until it survives a
second, hostile look. Workflows are for substantive tasks; solo is fine for
trivial/conversational turns.

### 5. Preserve the experience — no breaking changes
Every optimization was checked to NOT degrade the art/UX (screenshots compared;
"the flower looks identical"). When a behaviour was costly on mobile we **gated it
by device** (desktop keeps the rich continuous idle; mobile gets the lean version)
rather than deleting it. Prefer conditional behaviour over removal.

### 6. DEV → verify → PROD, and version for rollback
- `la-marguerite-dev.pages.dev` = staging; `la-marguerite.pages.dev`
  (+ `effeuille-la-marguerite` mirror) = prod.
- Ship to DEV → let the human test (on a real device when it matters) → only then
  merge to prod. **Never touch prod unverified.**
- **Version every release:** a SemVer git tag per functional commit, a
  `CHANGELOG.md` (version → commit → change), and Cloudflare prod deploys annotated
  with `--commit-message`/`--commit-hash` so prod is rollback-able from the
  dashboard or `git checkout vX.Y.Z`.

### 7. Clean git hygiene
- **Commit messages: no co-author trailer, no "Generated with / AI" reference.**
  Author = the repo's git identity. (Hard requirement.)
- Commit **source only** — strip test scaffolding (profiling scripts, dev-only deps
  like `playwright`) before committing so the deliverable stays clean.
- Branch for exploration (`perf/...`); fast-forward merge to `main` for releases;
  tag versions. Descriptive, specific messages.

### 8. Clean up after yourself
Reinstall throwaway tooling (`playwright`, profiling `.mjs`) only for a
verification, then remove it and confirm `git status` is clean. `package.json`
must list only real app deps.

### 9. Report honestly
When measurement overturns you, say so. Name what you deferred and *why* (e.g. the
falling-petal depth-pass z-swap was deferred because the design bible itself
offered a "keep in front" fallback and re-parenting risked repaint flicker). State
trade-offs. Never claim done-and-working without having checked.

### 10. Persist knowledge
Record non-obvious facts and gotchas in the memory store and `CHANGELOG.md`. Real
ones from this project:
- Port **5173 is held by another project's dev server** — use a dedicated port and
  verify the served `<title>` before screenshotting.
- **CSS `filter: blur()` on SVG child elements fails on mobile** — use an SVG
  filter or a gradient.
- **Playwright does not emulate the `(pointer: fine)` media query** (it stays true
  in headless), so device detection must include a user-agent check to be testable.

---

## Project quick reference

- **What it is:** *Effeuille la marguerite* — an art-grade, portrait, mobile-first
  daisy-plucking experience: tap the CTA → bloom → tap anywhere to pluck the
  nearest petal (a word per pluck) → staged verdict → replay.
- **Stack:** React 19 + Vite + GSAP 3.15 (Physics2D/MotionPath/DrawSVG/CustomEase)
  + Tone.js 15 (audio 100% synthesized, no assets). Plain JS/JSX. Procedural SVG
  flower.
- **Design source of truth:** `docs/DESIGN_BIBLE.md` (art direction + choreography).
  Don't diverge without reason.
- **Architecture:** `App.jsx` (state machine: intro → ritual → verdict → replay) ·
  `lib/daisy.js` (procedural model) · `lib/idle.js` (one `gsap.ticker`,
  device-gated, auto-rests on mobile, clock frozen during rest) ·
  `lib/petalChoreography.js` · `lib/particles.js` · `lib/audio.js` · `components/*`.
- **Run:** `npm install && npm run dev -- --port 5193 --strictPort --host 127.0.0.1`.
- **Build / deploy:** `npm run build` →
  `wrangler pages deploy dist --project-name la-marguerite-dev --branch main`
  (staging). Prod = `la-marguerite` (+ mirror `effeuille-la-marguerite`), only after
  verification, with `--commit-message "vX.Y.Z …" --commit-hash "$(git rev-parse HEAD)"`.
- **Versions & rollback:** see `CHANGELOG.md`. Roll back via the Cloudflare
  dashboard (instant) or `git checkout vX.Y.Z && npm run build && wrangler pages
  deploy dist --project-name la-marguerite --branch main`.
- **Mobile performance budget:** animate only `transform`/`opacity`; no
  `filter: blur()` on SVG children; SVG filters cost GPU only when their *content*
  changes (so cache them — don't transform their children every frame); the idle is
  throttled + auto-rests on mobile, continuous on desktop. **Re-measure (Playwright
  + CDP) before claiming any perf change.**

---

*In short: go slow to be right. Measure. Verify against the real thing. Fix the
root cause. Keep the art. Ship to dev first, version everything, report honestly.*
