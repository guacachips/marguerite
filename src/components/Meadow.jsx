/* L2 / L4 — living air: drifting pollen motes (recycled), two out-of-focus
   ghost daisies for depth, and a lone luminous spore that crosses the screen
   after a long stillness. Parallax pushes back and front layers in opposition. */
import { useEffect, useMemo, useRef } from 'react'
import gsap from '../lib/gsapSetup.js'

function GhostDaisy({ className, style }) {
  // a heavily-blurred, simplified daisy silhouette — never in focus
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return (
      <ellipse
        key={i}
        cx={50 + Math.cos(a) * 26}
        cy={50 + Math.sin(a) * 26}
        rx="7"
        ry="16"
        transform={`rotate(${(a * 180) / Math.PI + 90} ${50 + Math.cos(a) * 26} ${50 + Math.sin(a) * 26})`}
        fill="#FDFBF6"
      />
    )
  })
  return (
    <svg className={className} viewBox="0 0 100 100" style={style} aria-hidden="true">
      {petals}
      <circle cx="50" cy="50" r="13" fill="#F2C879" />
    </svg>
  )
}

export default function Meadow({ vec, reduced }) {
  const backRef = useRef(null)
  const frontRef = useRef(null)
  const sporeRef = useRef(null)

  const motes = useMemo(() => {
    const list = []
    const make = (front) => ({
      front,
      size: front ? 4 + Math.random() * 4 : 2 + Math.random() * 3,
      opacity: front ? 0.5 + Math.random() * 0.3 : 0.2 + Math.random() * 0.25,
      dur: (front ? 16 : 24) + Math.random() * 14,
      blur: front ? 0.4 + Math.random() * 1 : 1 + Math.random() * 2,
    })
    for (let i = 0; i < 16; i++) list.push(make(false))
    for (let i = 0; i < 5; i++) list.push(make(true))
    return list
  }, [])

  // recycle each mote rising from below, swaying, fading in/out
  useEffect(() => {
    const els = [
      ...(backRef.current?.querySelectorAll('.mote') || []),
      ...(frontRef.current?.querySelectorAll('.mote') || []),
    ]
    if (reduced) {
      // prefers-reduced-motion: a still, faint field — no drifting
      els.forEach((el, i) => {
        const m = motes[i]
        gsap.set(el, {
          left: `${(i * 37) % 100}%`,
          top: `${(i * 53) % 100}%`,
          x: 0,
          opacity: m.opacity * 0.6,
        })
      })
      return
    }
    let stopped = false
    const tls = []
    // rise via transform (translateY) only — animating top/left forces layout
    // every frame; profiling showed the motes alone cost ~1500 reflows / 6s.
    const H = backRef.current?.clientHeight || window.innerHeight || 800
    els.forEach((el, i) => {
      const m = motes[i]
      const run = () => {
        if (stopped) return
        gsap.set(el, { left: `${Math.random() * 100}%`, top: 0, y: H * 1.06, opacity: 0, scale: 1, x: 0 })
        const tl = gsap.timeline({ onComplete: run })
        tl.to(el, { y: -H * 0.06, duration: m.dur, ease: 'none' }, 0)
          .to(
            el,
            {
              keyframes: [
                { opacity: m.opacity, duration: 2.4 },
                { opacity: m.opacity, duration: Math.max(0.1, m.dur - 5) },
                { opacity: 0, duration: 2.6 },
              ],
              ease: 'none',
            },
            0
          )
          .to(
            el,
            { x: Math.random() * 44 - 22, duration: m.dur / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' },
            0
          )
        // distribute initial phase so they don't all start at the bottom
        tl.progress(Math.random() * 0.85)
        tls.push(tl)
      }
      run()
    })
    return () => {
      stopped = true
      tls.forEach((t) => t.kill())
    }
  }, [motes, reduced])

  // parallax — back and front drift in opposition
  useEffect(() => {
    if (!vec) return
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return // mobile: no parallax
    const back = backRef.current
    const front = frontRef.current
    const setB = back && gsap.quickSetter(back, 'css')
    const setF = front && gsap.quickSetter(front, 'css')
    const cb = () => {
      const { cx, cy } = vec.current
      if (setB) setB({ x: cx * -28, y: cy * -16 })
      if (setF) setF({ x: cx * 40, y: cy * 22 })
    }
    gsap.ticker.add(cb)
    return () => gsap.ticker.remove(cb)
  }, [vec])

  // a lone spore after long stillness
  useEffect(() => {
    if (reduced) return
    let timer
    const fly = () => {
      const el = sporeRef.current
      if (!el) return
      const W = frontRef.current?.clientWidth || window.innerWidth || 400
      gsap.set(el, { left: 0, top: `${30 + Math.random() * 40}%`, x: -0.06 * W, y: 0, opacity: 0, scale: 1 })
      gsap.to(el, {
        keyframes: [
          { opacity: 0.85, duration: 2 },
          { opacity: 0.85, duration: 6 },
          { opacity: 0, duration: 2 },
        ],
        ease: 'none',
      })
      gsap.to(el, {
        x: 1.08 * W,
        y: Math.random() * 30 - 18,
        duration: 10,
        ease: 'sine.inOut',
        onComplete: arm,
      })
    }
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(fly, 8200)
    }
    const onActivity = () => arm()
    window.addEventListener('pointerdown', onActivity, { passive: true })
    arm()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', onActivity)
    }
  }, [reduced])

  return (
    <>
      <div className="meadow meadow--back" ref={backRef} aria-hidden="true">
        <GhostDaisy
          className="ghost-daisy"
          style={{ left: '14%', top: '24%', width: '46%', opacity: 0.26 }}
        />
        <GhostDaisy
          className="ghost-daisy"
          style={{ left: '64%', top: '58%', width: '34%', opacity: 0.2 }}
        />
        {motes.slice(0, 16).map((m, i) => (
          <span
            key={i}
            className="mote"
            style={{
              width: m.size,
              height: m.size,
              filter: `blur(${m.blur}px)`,
            }}
          />
        ))}
      </div>
      <div className="meadow meadow--front" ref={frontRef} aria-hidden="true">
        {motes.slice(16).map((m, i) => (
          <span
            key={i}
            className="mote mote--front"
            style={{
              width: m.size,
              height: m.size,
              filter: `blur(${m.blur}px)`,
            }}
          />
        ))}
        <span className="spore" ref={sporeRef} />
      </div>
    </>
  )
}
