/* =========================================================================
   random.js — small, deterministic PRNG toolkit.
   A seeded RNG keeps a single run reproducible (every petal angle, jitter,
   and drift derives from one seed) while each new flower gets a fresh seed.
   ========================================================================= */

/** How many petals a freshly grown marguerite can have (per design bible). */
export const MIN_PETALS = 13
export const MAX_PETALS = 37

/** mulberry32 — tiny, fast, good-enough-for-art 32-bit PRNG. */
export function createRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A fresh 32-bit seed. Uses crypto when available, else Math.random. */
export function randomSeed() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0]
  }
  return (Math.random() * 0xffffffff) >>> 0
}

/** Float in [min, max). */
export function randRange(rng, min, max) {
  return min + (max - min) * rng()
}

/** Integer in [min, max] inclusive. */
export function randInt(rng, min, max) {
  return Math.floor(min + (max - min + 1) * rng())
}

/** Pick a random element. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

/** Symmetric jitter in [-amount, +amount). */
export function jitter(rng, amount) {
  return (rng() * 2 - 1) * amount
}

/** Approx. standard normal via averaging (cheap, no Box–Muller log). */
export function gaussian(rng) {
  return (rng() + rng() + rng() + rng() - 2) * 0.8660254 // var-normalized
}

/**
 * How many petals this flower grows. Biased slightly toward the middle of the
 * range so most runs feel like a "normal" daisy, with rare lush/sparse ones.
 */
export function rollPetalCount(rng) {
  const a = randInt(rng, MIN_PETALS, MAX_PETALS)
  const b = randInt(rng, MIN_PETALS, MAX_PETALS)
  return Math.round((a + b) / 2)
}
