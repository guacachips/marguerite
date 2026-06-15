# Changelog — Effeuille la marguerite

Every version below is a **git tag** on a deployable commit. To put any version
back into production, see **[Rollback](#rollback)** at the bottom.

Versioning: `MAJOR.MINOR.PATCH` — MINOR = new/restored behaviour, PATCH = fix.

---

## v1.3.1 — Wake-jump fix (mobile) · _latest, in prod_
Tapping the flower after the mobile auto-rest made it "teleport" to a new pose.
The idle **clock is now frozen during rest and rebased on wake**, so the
breathing/sway resume from exactly where they froze. No more jump.
· commit `cfe0645`

## v1.3.0 — Desktop idle restored + visible shadow
The flower **idles continuously again on desktop** (peaceful sway + petal
shiver, full rate); mobile stays lean (throttle + auto-rest). The ground shadow
was made clearly **visible** (radial-gradient plateau).
· commit `85ce1ad`

## v1.2.2 — Mobile ground-shadow fix
The ground shadow used a CSS `blur`, which **doesn't render on SVG child
elements on mobile** (it showed as a hard opaque green ellipse). Replaced by a
soft **radial-gradient** fill — renders everywhere, zero GPU cost.
· commit `5c8cc54`

## v1.2.1 — Reduce ritual steady-state heat (round 2)
Throttle the idle to ~30 fps on mobile, drop the per-petal shiver, **auto-rest**
the flower + meadow after ~1.3 s of inactivity, fewer ambient motes. Fixes the
heating while lingering between petals.
· commit `687dec2`

## v1.2.0 — Mobile overheating fix (round 1)
Gate the idle to the ritual, make the heart-pollen **static** (the #1 GPU cost),
**one** grouped watercolor filter, transform-based motes, no parallax on touch,
suspend audio when backgrounded, shorter reverb.
· commit `638f59a`

## v1.1.0 — Tap anywhere
Tapping **anywhere** on the scene plucks the petal nearest the tap — no need to
hit a thin petal precisely.
· commit `8086157`

## v1.0.1 — No motion-permission prompt
Remove the device-motion (gyroscope) parallax on mobile, so the app no longer
triggers the iOS "motion & orientation access" prompt. Desktop mouse parallax
kept.
· commit `bc98c02`

## v1.0.0 — Initial release
The complete art-grade experience: procedural watercolor daisy, tap-to-pluck
choreography, fully synthesized sound, staged verdict reveal.
· commit `6d36e31`

---

## Rollback

**A. Cloudflare dashboard — instant, no rebuild (recommended for prod).**
Cloudflare Pages keeps every deployment; each prod deploy here is labelled with
its version. In the `la-marguerite` project → **Deployments**, pick a previous
one and **"Rollback to this deployment"**. (List them from the CLI with
`wrangler pages deployment list --project-name la-marguerite`.)

**B. From git — rebuild a tagged version.**
```bash
git checkout v1.2.0                 # the version you want to restore
npm install && npm run build
wrangler pages deploy dist --project-name la-marguerite --branch main \
  --commit-message "rollback to v1.2.0" --commit-hash "$(git rev-parse HEAD)"
git checkout main                   # return to the latest
```

> Environments: **prod** = `la-marguerite.pages.dev` (+ mirror
> `effeuille-la-marguerite.pages.dev`); **staging** = `la-marguerite-dev.pages.dev`.
