/* The verdict — a held breath. A cream veil rises like a turning page, a card
   floats up, and the landed word writes itself letter by letter in ink on damp
   paper. A lone rescued petal drifts. "Une autre fleur" begins again. */
import { useEffect, useRef } from 'react'
import gsap from '../lib/gsapSetup.js'
import { COPY } from '../lib/phrases.js'

export default function VerdictCard({ entry, onReplay, reduced }) {
  const rootRef = useRef(null)
  const veilRef = useRef(null)
  const cardRef = useRef(null)
  const kickerRef = useRef(null)
  const wordRef = useRef(null)
  const lineRef = useRef(null)
  const ornRef = useRef(null)
  const ctaRef = useRef(null)
  const reliqueRef = useRef(null)
  const leaving = useRef(false)

  const kicker = entry.id === 'pas-du-tout' ? 'le verdict' : 'le cœur dit'

  useEffect(() => {
    const letters = wordRef.current ? wordRef.current.querySelectorAll('.vl') : []

    if (reduced) {
      gsap.set(veilRef.current, { opacity: 1, y: '0%' })
      gsap.set([cardRef.current, kickerRef.current, lineRef.current, ornRef.current, ctaRef.current], {
        opacity: 1,
        y: 0,
      })
      gsap.set(letters, { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 })
      ctaRef.current && ctaRef.current.focus({ preventScroll: true })
      return
    }

    gsap.set(rootRef.current, { '--sat': 1 })
    const tl = gsap.timeline()
    tl.fromTo(
      veilRef.current,
      { y: '100%', opacity: 0.7 },
      { y: '0%', opacity: 1, duration: 0.7, ease: 'power2.out' }
    )
      .fromTo(
        cardRef.current,
        { y: 40, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.4)' },
        '-=0.35'
      )
      .fromTo(kickerRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
      .fromTo(
        letters,
        { opacity: 0, filter: 'blur(14px)', y: 8, scale: 0.9 },
        {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.045,
        },
        '-=0.15'
      )
      .fromTo(lineRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
      .fromTo(
        ornRef.current,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(2)' },
        '-=0.5'
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '+=0.1'
      )
      .to(rootRef.current, { '--sat': 1.08, duration: 1.2, ease: 'sine.inOut' }, 0)

    // the rescued petal drifts gently, forever
    const rel = reliqueRef.current
    let drift
    if (rel) {
      drift = gsap.to(rel, {
        y: '+=10',
        rotation: '+=8',
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    }

    // move focus into the dialog once revealed (keyboard accessibility)
    tl.eventCallback('onComplete', () => {
      ctaRef.current && ctaRef.current.focus({ preventScroll: true })
    })

    return () => {
      tl.kill()
      drift && drift.kill()
    }
  }, [reduced, entry])

  const handleReplay = () => {
    if (leaving.current) return
    leaving.current = true
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: reduced ? 0.3 : 0.6,
      ease: 'power2.in',
      onComplete: () => onReplay && onReplay(),
    })
  }

  const chars = Array.from(entry.label)

  return (
    <div className="verdict" ref={rootRef}>
      <div className="veil" ref={veilRef} />
      <div className="verdict-card" ref={cardRef} role="dialog" aria-label={`Verdict : ${entry.label}`}>
        <p className="verdict-kicker" ref={kickerRef}>
          {kicker}
        </p>
        <h2 className="verdict-word" ref={wordRef} style={{ color: entry.textAccent }} aria-live="polite">
          {chars.map((c, i) => (
            <span key={i} className="vl">
              {c === ' ' ? ' ' : c}
            </span>
          ))}
        </h2>
        <p className="verdict-line" ref={lineRef}>
          {entry.line}
        </p>
        <div className="verdict-ornament" ref={ornRef} aria-hidden="true">
          <span className="orn-petal" />
          <span className="orn-glyph" style={{ color: entry.accent }}>
            {entry.glyph}
          </span>
          <span className="orn-petal" />
        </div>
        <button className="btn btn--replay" ref={ctaRef} onClick={handleReplay}>
          {COPY.replay}
        </button>
      </div>
      <svg className="relique" ref={reliqueRef} viewBox="0 0 30 60" aria-hidden="true">
        <path
          d="M15,2 C7,16 6,40 15,58 C24,40 23,16 15,2 Z"
          fill="#FDFBF6"
          stroke="#EAD9C4"
          strokeWidth="0.6"
        />
      </svg>
    </div>
  )
}
