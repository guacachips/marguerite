/* The fixed word band in the upper third. Two stacked spans cross-fade so a
   new word "blooms" as the old one lifts away — never a reflow, never a jump.
   A watercolor underline draws itself; "à la folie" trembles. aria-live keeps
   it accessible. */
import { useEffect, useRef } from 'react'
import gsap from '../lib/gsapSetup.js'

export default function WordBand({ wordEntry, reduced }) {
  const aRef = useRef(null)
  const bRef = useRef(null)
  const underlineRef = useRef(null)
  const liveRef = useRef(null)
  const showing = useRef(null) // 'a' | 'b' | null

  useEffect(() => {
    const a = aRef.current
    const b = bRef.current
    if (!a || !b) return

    if (!wordEntry) {
      gsap.to([a, b], { opacity: 0, duration: 0.3 })
      showing.current = null
      return
    }

    const inEl = showing.current === 'a' ? b : a
    const outEl = showing.current === 'a' ? a : b

    inEl.textContent = wordEntry.label
    inEl.style.color = wordEntry.textAccent // accessible darkened hue
    if (liveRef.current) liveRef.current.textContent = wordEntry.label

    if (reduced) {
      gsap.set(outEl, { opacity: 0 })
      gsap.fromTo(inEl, { opacity: 0 }, { opacity: 1, duration: 0.3 })
    } else {
      gsap.to(outEl, {
        y: -14,
        opacity: 0,
        filter: 'blur(6px)',
        letterSpacing: '0.16em',
        duration: 0.22,
        ease: 'power2.in',
        overwrite: 'auto',
      })
      gsap.fromTo(
        inEl,
        { y: 14, opacity: 0, scale: 0.92, filter: 'blur(8px)', letterSpacing: '0.06em' },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          letterSpacing: '0.02em',
          duration: 0.36,
          delay: 0.1,
          ease: 'back.out(2.2)',
          overwrite: 'auto',
        }
      )

      if (underlineRef.current) {
        gsap.fromTo(
          underlineRef.current,
          { drawSVG: '50% 50%', opacity: 0.9 },
          { drawSVG: '0% 100%', duration: 0.5, delay: 0.14, ease: 'power2.out' }
        )
        gsap.to(underlineRef.current, { opacity: 0, duration: 0.6, delay: 0.85 })
      }

      // "à la folie" trembles with passion
      inEl.classList.remove('is-folie')
      if (wordEntry.id === 'a-la-folie') {
        // reflow to restart the animation
        void inEl.offsetWidth
        inEl.classList.add('is-folie')
      }
    }

    showing.current = showing.current === 'a' ? 'b' : 'a'
  }, [wordEntry, reduced])

  return (
    <div className="word-band">
      <div className="word-stack">
        <span className="word" ref={aRef} />
        <span className="word" ref={bRef} />
        <svg className="word-underline" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true">
          <path
            ref={underlineRef}
            d="M4,8 Q34,1 62,7 T116,5"
            fill="none"
            stroke="#E8B4B8"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="sr-only" aria-live="polite" ref={liveRef} />
    </div>
  )
}
