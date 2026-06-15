/* The opening: a poetic title and the CTA that wakes the audio and blooms the
   flower. The CTA's onStart MUST run inside the click gesture (Tone.start). */
import { useEffect, useRef } from 'react'
import gsap from '../lib/gsapSetup.js'
import { COPY } from '../lib/phrases.js'

export default function IntroScreen({ phase, onStart, onExited, reduced }) {
  const rootRef = useRef(null)
  const titleRef = useRef(null)
  const lineRef = useRef(null)
  const ctaRef = useRef(null)
  const started = useRef(false)

  // entrance
  useEffect(() => {
    if (reduced) {
      gsap.set([titleRef.current, lineRef.current, ctaRef.current], { opacity: 1, y: 0 })
      return
    }
    const tl = gsap.timeline({ delay: 0.2 })
    tl.from(titleRef.current, { opacity: 0, y: 22, duration: 1.0, ease: 'power3.out' })
      .from(lineRef.current, { opacity: 0, y: 16, duration: 0.8, ease: 'power2.out' }, '-=0.5')
      .from(ctaRef.current, { opacity: 0, y: 18, scale: 0.96, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.3')
    return () => tl.kill()
  }, [reduced])

  // exit when the ritual begins
  useEffect(() => {
    if (phase === 'intro') return
    gsap.to(rootRef.current, {
      opacity: 0,
      y: -12,
      duration: reduced ? 0.3 : 0.7,
      ease: 'power2.in',
      onComplete: () => onExited && onExited(),
    })
  }, [phase, reduced, onExited])

  const handleCta = () => {
    if (started.current) return
    started.current = true
    onStart() // synchronous → keeps the user-gesture for Tone.start()
  }

  const titleLines = COPY.introTitle.split('\n')
  const subLines = COPY.introLine.split('\n')

  return (
    <div className="intro" ref={rootRef}>
      <div className="intro-top">
        <h1 className="intro-title" ref={titleRef}>
          {titleLines.map((l, i) => (
            <span key={i} className="intro-title-line">
              {l}
            </span>
          ))}
        </h1>
        <p className="intro-line" ref={lineRef}>
          {subLines.map((l, i) => (
            <span key={i}>
              {l}
              {i < subLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      </div>
      <div className="intro-bottom">
        <button className="btn btn--cta" ref={ctaRef} onClick={handleCta} aria-label={COPY.cta}>
          <span className="btn-label">{COPY.cta}</span>
          <span className="btn-shimmer" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
