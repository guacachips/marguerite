/* =========================================================================
   daisy.js — procedural marguerite model (pure data, zero DOM).
   generateDaisy(seed) returns everything Daisy.jsx needs to draw a unique,
   hand-painted-looking flower: petal paths, the phyllotaxis pollen core,
   a soft S-curve stem and two leaves. Deterministic from the seed.
   ========================================================================= */
import {
  createRng,
  randInt,
  randRange,
  jitter,
  MIN_PETALS,
  MAX_PETALS,
} from './random.js'

/** SVG canvas the flower is authored in (portrait, fills the stage). */
export const VIEW = { w: 400, h: 760 }
/** Flower head center — ~53% down so the head reads at mid-stage and the stem
    can fall to the bottom edge. */
export const CENTER = { x: 200, y: 400 }
/** Radius of the saffron heart disc. */
export const HEART_R = 33
/** How far a petal's narrow base sits from the exact center. */
export const PETAL_BASE_R = 26

/* ---- color helper ----------------------------------------------------- */
function hexLerp(a, b, t) {
  const ah = parseInt(a.slice(1), 16)
  const bh = parseInt(b.slice(1), 16)
  const ar = ah >> 16,
    ag = (ah >> 8) & 255,
    ab = ah & 255
  const br = bh >> 16,
    bg = (bh >> 8) & 255,
    bb = bh & 255
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

/**
 * A single petal as an SVG path: narrow base at (0,0), tip at (0,-L),
 * pointing straight up. Slightly asymmetric (seed) with a soft bilobed,
 * notched tip — never geometric.
 */
function petalPath(L, W, seed) {
  const half = W / 2
  const a = (seed - 0.5) * 0.16 // left/right imbalance
  const wL = half * (1 + a)
  const wR = half * (1 - a)
  const notch = L > 0 ? 3.2 : 0
  return [
    `M0,0`,
    `C${(-wL * 1.02).toFixed(1)},${(-L * 0.14).toFixed(1)} ${(-wL).toFixed(1)},${(-L * 0.5).toFixed(1)} ${(-wL * 0.62).toFixed(1)},${(-L * 0.78).toFixed(1)}`,
    `C${(-wL * 0.4).toFixed(1)},${(-L * 0.9).toFixed(1)} -3,${(-L * 0.985).toFixed(1)} -2.2,${(-L).toFixed(1)}`,
    `Q0,${(-L + notch).toFixed(1)} 2.2,${(-L).toFixed(1)}`,
    `C3,${(-L * 0.985).toFixed(1)} ${(wR * 0.4).toFixed(1)},${(-L * 0.9).toFixed(1)} ${(wR * 0.62).toFixed(1)},${(-L * 0.78).toFixed(1)}`,
    `C${(wR).toFixed(1)},${(-L * 0.5).toFixed(1)} ${(wR * 1.02).toFixed(1)},${(-L * 0.14).toFixed(1)} 0,0`,
    `Z`,
  ].join(' ')
}

/** Lancet leaf hanging off the stem at point (px,py), dir = +1 right / -1 left. */
function leafPath(px, py, dir, size, lift) {
  const tx = px + dir * size
  const ty = py - size * lift
  return [
    `M${px.toFixed(1)},${py.toFixed(1)}`,
    `Q${(px + dir * size * 0.45).toFixed(1)},${(py - size * 0.85).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`,
    `Q${(px + dir * size * 0.78).toFixed(1)},${(py + size * 0.16).toFixed(1)} ${px.toFixed(1)},${(py + size * 0.18).toFixed(1)}`,
    `Z`,
  ].join(' ')
}

/**
 * Build a full daisy model from a numeric seed.
 * @param {number} seed
 */
export function generateDaisy(seed) {
  const rng = createRng(seed >>> 0)

  // Petal count: average of two rolls → gentle bias to the middle of 13–37,
  // so most flowers feel "normal" with rare sparse/lush ones.
  const petalCount = Math.round(
    (randInt(rng, MIN_PETALS, MAX_PETALS) + randInt(rng, MIN_PETALS, MAX_PETALS)) / 2
  )

  const step = 360 / petalCount
  const petals = []
  for (let i = 0; i < petalCount; i++) {
    const angle = i * step + jitter(rng, 4)
    const lengthScale = randRange(rng, 0.92, 1.08)
    const length = 84 * lengthScale
    const width = randRange(rng, 19, 24)
    const seedP = rng()
    petals.push({
      index: i,
      angleDeg: angle,
      length,
      width,
      lengthScale,
      seed: seedP,
      pathD: petalPath(length, width, seedP),
      // per-petal idle "shiver" params (frequencies kept incommensurate)
      swayAmp: randRange(rng, 0.45, 1.0),
      swayPeriod: randRange(rng, 3.0, 4.2),
      swayPhase: rng() * Math.PI * 2,
    })
  }

  // Phyllotaxis pollen on the heart (golden angle spiral).
  const pollen = []
  const POLLEN_N = 66
  for (let i = 0; i < POLLEN_N; i++) {
    const a = i * 2.39996323 // golden angle in radians (137.5°)
    const r = 4.05 * Math.sqrt(i)
    if (r > HEART_R - 2.5) continue
    const t = i / POLLEN_N
    pollen.push({
      dx: Math.cos(a) * r,
      dy: Math.sin(a) * r,
      r: randRange(rng, 0.8, 1.7),
      fill: hexLerp('#E5A33C', '#D98E2B', t),
      baseOpacity: 0.5 + 0.4 * rng(),
      phase: rng() * Math.PI * 2,
    })
  }

  // Stem: a soft S from just under the heart down past the bottom edge.
  const sx = CENTER.x
  const sy = CENTER.y + HEART_R - 4
  const stem =
    `M${sx},${sy} ` +
    `C${sx - 16},${sy + 110} ${sx + 18},${sy + 215} ${sx - 5},${VIEW.h + 24}`

  // Two asymmetric leaves along the stem.
  const leaves = [
    leafPath(sx - 6, sy + 150, 1, 46, 0.55),
    leafPath(sx + 7, sy + 220, -1, 38, 0.62),
  ]

  return {
    seed,
    petalCount,
    view: VIEW,
    center: CENTER,
    heartR: HEART_R,
    baseR: PETAL_BASE_R,
    petals,
    pollen,
    stem,
    leaves,
  }
}
