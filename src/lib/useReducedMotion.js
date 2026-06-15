/* =========================================================================
   useReducedMotion — reactive prefers-reduced-motion flag.
   Components branch on this to swap the rich physics for calm fades.
   ========================================================================= */
import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function read() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(QUERY).matches
  )
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(read)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const onChange = () => setReduced(mq.matches)
    // Safari < 14 uses the legacy API
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  return reduced
}
