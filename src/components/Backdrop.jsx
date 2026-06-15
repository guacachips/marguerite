/* L0 / L1 — the painted air behind the flower: soft sky, out-of-focus washes
   of sage and blush (slow parallax), faint volumetric rays, a sage vignette,
   and a fixed paper grain. Purely decorative, never interactive. */
import { useEffect, useRef } from 'react'
import gsap from '../lib/gsapSetup.js'

export default function Backdrop({ vec }) {
  const lavisRef = useRef(null)

  useEffect(() => {
    if (!vec) return
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return // mobile: no parallax
    const el = lavisRef.current
    if (!el) return
    const set = gsap.quickSetter(el, 'css')
    const cb = () => {
      const { cx, cy } = vec.current
      set({ x: cx * -16, y: cy * -10 })
    }
    gsap.ticker.add(cb)
    return () => gsap.ticker.remove(cb)
  }, [vec])

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="lavis" ref={lavisRef}>
        <span className="blob blob--sage" />
        <span className="blob blob--blush" />
        <span className="blob blob--sun" />
      </div>
      <div className="rays" />
      <div className="vignette" />
      <svg className="grain" width="100%" height="100%" preserveAspectRatio="none">
        <filter id="bgPaperGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#bgPaperGrain)" />
      </svg>
    </div>
  )
}
