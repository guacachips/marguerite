/* =========================================================================
   particles.js — a pooled, SVG-native particle system living in the flower's
   own coordinate space (no screen-coord conversion, crisp on retina).
   Emits ejected pollen (Physics2D) at the break point, expanding ripples,
   and the rising verdict bloom. Nodes are reused — no create/destroy churn.
   ========================================================================= */
import gsap from './gsapSetup.js'

const SVGNS = 'http://www.w3.org/2000/svg'

/**
 * @param {SVGGElement} fxGroup  an empty <g> inside the daisy SVG to host fx.
 */
export function createParticles(fxGroup) {
  const POOL = 120
  const motes = []
  const free = []

  for (let i = 0; i < POOL; i++) {
    const c = document.createElementNS(SVGNS, 'circle')
    c.setAttribute('r', '2')
    c.setAttribute('cx', '0')
    c.setAttribute('cy', '0')
    c.style.opacity = '0'
    fxGroup.appendChild(c)
    motes.push(c)
    free.push(c)
  }

  // small pool of stroke rings for ripples
  const RINGS = 12
  const rings = []
  for (let i = 0; i < RINGS; i++) {
    const r = document.createElementNS(SVGNS, 'circle')
    r.setAttribute('fill', 'none')
    r.setAttribute('cx', '0')
    r.setAttribute('cy', '0')
    r.setAttribute('r', '1')
    r.style.opacity = '0'
    fxGroup.appendChild(r)
    rings.push(r)
  }
  let ringIdx = 0

  function take() {
    const c = free.pop()
    if (c) c.style.willChange = 'transform, opacity' // only while in flight
    return c || null
  }
  function back(c) {
    c.style.opacity = '0'
    c.style.willChange = 'auto'
    gsap.set(c, { clearProps: 'transform' })
    free.push(c)
  }

  /** Burst of pollen ejected from (x,y) in viewBox units. */
  function emitPollen(x, y, count = 8, opts = {}) {
    const {
      color = '#E8A33D',
      angleMin = -120,
      angleMax = -60,
      vmin = 80,
      vmax = 180,
      gravity = 220,
    } = opts
    const n = Math.min(count, free.length)
    for (let i = 0; i < n; i++) {
      const c = take()
      if (!c) break
      const size = 1.5 + Math.random() * 2.4
      c.setAttribute('r', size.toFixed(2))
      c.setAttribute('fill', color)
      gsap.set(c, { x, y, opacity: 1, scale: 1, transformOrigin: '0px 0px' })
      gsap.to(c, {
        duration: 0.6 + Math.random() * 0.5,
        physics2D: {
          velocity: vmin + Math.random() * (vmax - vmin),
          angle: angleMin + Math.random() * (angleMax - angleMin),
          gravity,
          friction: 0.04,
        },
        opacity: 0,
        scale: 0.2,
        ease: 'power1.out',
        onComplete: () => back(c),
      })
    }
  }

  /** Two concentric ripples expanding from (x,y). */
  function rippleAt(x, y, opts = {}) {
    const { color = '#F2C879', max = 120 } = opts
    for (let k = 0; k < 2; k++) {
      const r = rings[ringIdx]
      ringIdx = (ringIdx + 1) % rings.length
      gsap.killTweensOf(r)
      r.setAttribute('stroke', color)
      r.setAttribute('stroke-width', (1.6 - k * 0.5).toFixed(2))
      gsap.set(r, { attr: { cx: x, cy: y, r: 2 }, opacity: 0.5 - k * 0.18 })
      gsap.to(r, {
        attr: { r: max * (1 - k * 0.25) },
        opacity: 0,
        duration: 0.7 + k * 0.12,
        delay: k * 0.06,
        ease: 'power2.out',
      })
    }
  }

  /** The verdict bloom — pollen rising like inverted rain from (x,y). */
  function verdictRain(x, y, count = 40, opts = {}) {
    const { color = '#F2C879' } = opts
    const n = Math.min(count, free.length)
    for (let i = 0; i < n; i++) {
      const c = take()
      if (!c) break
      const size = 1.6 + Math.random() * 3
      c.setAttribute('r', size.toFixed(2))
      c.setAttribute('fill', i % 4 === 0 ? '#FDFBF6' : color)
      gsap.set(c, {
        x: x + (Math.random() * 120 - 60),
        y: y + Math.random() * 30,
        opacity: 0,
        scale: 1,
        transformOrigin: '0px 0px',
      })
      gsap.to(c, { opacity: 0.9, duration: 0.3, delay: Math.random() * 0.5 })
      gsap.to(c, {
        duration: 1.6 + Math.random() * 1.2,
        delay: Math.random() * 0.5,
        physics2D: {
          velocity: 120 + Math.random() * 140,
          angle: -90 + (Math.random() * 70 - 35),
          gravity: -22,
          friction: 0.02,
        },
        opacity: 0,
        scale: 0.3,
        ease: 'power1.out',
        onComplete: () => back(c),
      })
    }
  }

  function clear() {
    gsap.killTweensOf(motes)
    motes.forEach((c) => {
      c.style.opacity = '0'
    })
    free.length = 0
    for (const c of motes) free.push(c)
  }

  function dispose() {
    gsap.killTweensOf(motes)
    gsap.killTweensOf(rings)
    motes.forEach((c) => c.remove())
    rings.forEach((r) => r.remove())
    motes.length = 0
    free.length = 0
  }

  return { emitPollen, rippleAt, verdictRain, clear, dispose }
}
