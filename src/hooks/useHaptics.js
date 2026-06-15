/* =========================================================================
   useHaptics — tactile feedback via the Vibration API, gracefully degrading.
   The body responds even when the ears can't: every petal is felt.
   ========================================================================= */
import { useCallback, useMemo, useRef } from 'react'

const supported =
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

function buzz(pattern) {
  if (!supported) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* some browsers throw if called without a user gesture — ignore */
  }
}

/**
 * Returns a stable haptics API. Pass enabled=false to silence all feedback
 * (e.g. a user setting); calls become no-ops.
 */
export function useHaptics(enabled = true) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const fire = useCallback((pattern) => {
    if (!enabledRef.current) return
    buzz(pattern)
  }, [])

  return useMemo(
    () => ({
      supported,
      /** Light confirmation when the ritual begins. */
      start: () => fire([10, 30, 18]),
      /** A single petal release. Intensity 0..1 lengthens the pulse. */
      pluck: (intensity = 0.5) => fire([8 + Math.round(intensity * 14)]),
      /** The final petal — a touch heavier. */
      lastPluck: () => fire([26]),
      /** The verdict reveal, shaped by intensity. */
      verdict: (intensity = 0.6) =>
        fire(
          intensity >= 0.85
            ? [0, 30, 40, 30, 60, 40]
            : intensity <= 0.05
              ? [0, 18]
              : [0, 24, 50, 30]
        ),
      /** Generic soft tap (UI affordances). */
      tap: () => fire([6]),
      /** Cancel any ongoing vibration. */
      stop: () => fire(0),
    }),
    [fire]
  )
}
