/* =========================================================================
   phrases.js — the comptine, locked content.
   The five-word cycle children chant while plucking a daisy, plus the
   emotional "verdict" staging metadata for the word the last petal lands on.
   ========================================================================= */

/**
 * The cycle, in order. Index 0 is the first petal plucked.
 * Each entry carries staging metadata for when this word becomes the verdict:
 *  - line: a short poetic subtitle revealed under the word
 *  - mood: emotional register (drives audio + light + motion)
 *  - intensity: 0..1, how "loud" the reveal is
 *  - accent / accentVar: the palette color that warms the reveal
 *  - glyph: a tiny decorative botanical mark
 */
// `accent` is the decorative hue (ornaments, underline, glow).
// `textAccent` is a darkened sibling used for TEXT, meeting WCAG large-text
// contrast on the cream/card backgrounds (~4.2–4.9:1).
export const CYCLE = [
  {
    index: 0,
    id: 'un-peu',
    label: 'un peu',
    line: 'un murmure du cœur',
    mood: 'tendre',
    intensity: 0.3,
    accent: '#E8B4B8',
    accentVar: 'var(--c-blush)',
    textAccent: '#B05A62',
    glyph: '·',
  },
  {
    index: 1,
    id: 'beaucoup',
    label: 'beaucoup',
    line: 'le cœur déborde',
    mood: 'chaleureux',
    intensity: 0.62,
    accent: '#F2C879',
    accentVar: 'var(--c-sun)',
    textAccent: '#9C7212',
    glyph: '✿',
  },
  {
    index: 2,
    id: 'passionnement',
    label: 'passionnément',
    line: 'un feu doux et vif',
    mood: 'ardent',
    intensity: 0.85,
    accent: '#D8979D',
    accentVar: 'var(--c-blush-deep)',
    textAccent: '#A85761',
    glyph: '❀',
  },
  {
    index: 3,
    id: 'a-la-folie',
    label: 'à la folie',
    line: 'sans mesure, sans raison',
    mood: 'euphorique',
    intensity: 1.0,
    accent: '#E5A33C',
    accentVar: 'var(--c-sun-deep)',
    textAccent: '#A8650A',
    glyph: '✺',
  },
  {
    index: 4,
    id: 'pas-du-tout',
    label: 'pas du tout',
    line: 'le cœur reste libre',
    mood: 'serein',
    intensity: 0.0,
    accent: '#A7BE8C',
    accentVar: 'var(--c-sage-deep)',
    textAccent: '#5E7544',
    glyph: '✢',
  },
]

export const CYCLE_LENGTH = CYCLE.length

/** The word for the k-th petal plucked (0-based). Wraps around the cycle. */
export function wordAt(petalIndex) {
  return CYCLE[((petalIndex % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH]
}

/**
 * The verdict = the word landed on when the LAST petal is plucked.
 * For a flower with `petalCount` petals, the last petal is index petalCount-1.
 */
export function verdictForPetalCount(petalCount) {
  if (petalCount <= 0) return CYCLE[CYCLE_LENGTH - 1]
  return wordAt(petalCount - 1)
}

/** Convenience: the intro CTA copy. */
export const COPY = {
  introTitle: 'Effeuille\nla marguerite',
  introLine: 'Pense très fort à quelqu’un,\npuis détache les pétales un à un.',
  cta: 'Effeuiller la marguerite',
  pluckHint: 'touche un pétale',
  lastPetalHint: 'le dernier pétale…',
  replay: 'Une autre fleur',
  verdictKicker: 'la marguerite a parlé',
}
