/* =========================================================================
   petalChoreography.js — the heart of the juice. One self-contained, fire-
   and-forget routine per petal: anticipation/squash → elastic snap → the
   petal is "promoted" into world space (re-parented, current transform baked
   via getScreenCTM) → it planes down with a fluttering 3D-faked tumble → fades.
   onSnap() fires at the exact break instant so Daisy can sync sound, word,
   pollen, ripple, haptics and the core's heartbeat.
   ========================================================================= */
import gsap from './gsapSetup.js'

const SVGNS = 'http://www.w3.org/2000/svg'

function matrixStr(m) {
  return `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`
}

/**
 * @param {object} o
 * @param {SVGPathElement} o.pathEl       the petal path (still attached)
 * @param {SVGGElement}    o.anchorEl      the petal anchor <g> to remove
 * @param {SVGGElement}    o.fallingGroup  world-space <g> to host the fall
 * @param {boolean}        o.reduced       prefers-reduced-motion
 * @param {(breakPoint:{x:number,y:number}|null)=>void} o.onSnap
 * @param {()=>void}       o.onComplete
 */
export function pluckPetal(o) {
  const { pathEl, anchorEl, fallingGroup, reduced, onSnap, onComplete, fallScale = 1 } = o

  // ---- reduced motion: a calm fade, no physics ------------------------
  if (reduced) {
    let bp = null
    try {
      const ctm = pathEl.getScreenCTM()
      const inv = fallingGroup.getScreenCTM().inverse()
      const m = inv.multiply(ctm)
      bp = { x: m.e, y: m.f }
    } catch {
      bp = null
    }
    onSnap && onSnap(bp)
    gsap.to(anchorEl, {
      opacity: 0,
      y: 16,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        anchorEl.remove()
        onComplete && onComplete()
      },
    })
    return
  }

  // ---- phase 1 + 2: squash, then elastic release ---------------------
  const sq = gsap.timeline()
  sq.to(pathEl, {
    scaleX: 0.94,
    scaleY: 1.06,
    y: 2,
    duration: 0.1,
    ease: 'power3.in',
    transformOrigin: '50% 100%',
  })
    .to(pathEl, {
      scaleX: 1.05,
      scaleY: 1.04,
      duration: 0.06,
      ease: 'back.out(3)',
      transformOrigin: '50% 100%',
    })
    .add(startFall)

  function startFall() {
    // bake the petal's live world transform, promote into the falling layer
    let m
    try {
      m = fallingGroup.getScreenCTM().inverse().multiply(pathEl.getScreenCTM())
    } catch {
      // if matrices are unavailable, just remove and report
      onSnap && onSnap(null)
      anchorEl.remove()
      onComplete && onComplete()
      return
    }

    const world = document.createElementNS(SVGNS, 'g')
    world.setAttribute('transform', matrixStr(m))
    world.style.pointerEvents = 'none'

    const motion = document.createElementNS(SVGNS, 'g')
    motion.style.willChange = 'transform, opacity'

    const clone = pathEl.cloneNode(true)
    clone.removeAttribute('transform')
    clone.style.transform = ''
    clone.removeAttribute('data-index')
    clone.classList.remove('petal-path') // decorative now — not a tap target
    clone.setAttribute('aria-hidden', 'true')
    clone.removeAttribute('filter') // drop the heavy watercolor pass while falling
    clone.style.pointerEvents = 'none'

    motion.appendChild(clone)
    world.appendChild(motion)
    fallingGroup.appendChild(world)

    const breakPoint = { x: m.e, y: m.f }
    // remove the original from the flower — the petal is gone
    anchorEl.remove()
    onSnap && onSnap(breakPoint)

    // ---- phase 3 + 4: plane down, flutter, fade ----------------------
    const dir = Math.random() < 0.5 ? -1 : 1
    const drift = dir * (40 + Math.random() * 80)
    const fall = 360 + Math.random() * 160
    const tumble = Math.random() * 440 - 220
    const dur = 0.92 + Math.random() * 0.24

    // after-image trail — faint echoes lagging behind (ink bleeding in water).
    // Skipped on the final petal (it planes alone) — fallScale signals that.
    if (fallScale === 1) {
      for (const g of [
        { delay: 0.04, opacity: 0.15 },
        { delay: 0.08, opacity: 0.1 },
        { delay: 0.12, opacity: 0.05 },
      ]) {
        const gw = document.createElementNS(SVGNS, 'g')
        gw.setAttribute('transform', matrixStr(m))
        gw.style.pointerEvents = 'none'
        const gm = document.createElementNS(SVGNS, 'g')
        gm.style.willChange = 'transform, opacity'
        gm.style.filter = 'blur(3px)'
        const gc = pathEl.cloneNode(true)
        gc.removeAttribute('filter') // lighter than the watercolor pass
        gc.removeAttribute('data-index')
        gc.classList.remove('petal-path')
        gc.setAttribute('aria-hidden', 'true')
        gc.style.pointerEvents = 'none'
        gm.appendChild(gc)
        gw.appendChild(gm)
        fallingGroup.insertBefore(gw, world) // behind the real petal
        gsap.set(gm, { opacity: g.opacity })
        gsap
          .timeline({ delay: g.delay, onComplete: () => gw.remove() })
          .to(gm, { y: fall, duration: dur, ease: 'petalFall' }, 0)
          .to(gm, { x: drift, duration: dur, ease: 'sine.inOut' }, 0)
          .to(gm, { rotation: tumble, duration: dur, ease: 'power1.out', transformOrigin: '50% 50%' }, 0)
          .to(
            gm,
            { keyframes: { scaleX: [1, 0.45, 0.78], ease: 'sine.inOut' }, duration: dur, transformOrigin: '50% 50%' },
            0
          )
          .to(gm, { opacity: 0, duration: dur * 0.5, ease: 'power1.in' }, dur * 0.45)
      }
    }

    const fl = gsap.timeline({
      onComplete: () => {
        world.remove()
        onComplete && onComplete()
      },
    })
    fl.to(motion, { y: fall, duration: dur, ease: 'petalFall' }, 0)
      .to(motion, { x: drift, duration: dur, ease: 'sine.inOut' }, 0)
      .to(
        motion,
        { rotation: tumble, duration: dur, ease: 'power1.out', transformOrigin: '50% 50%' },
        0
      )
      // flutter + shrink folded into scaleX/scaleY keyframes (can't tween `scale` too)
      .to(
        motion,
        {
          keyframes: { scaleX: [1, 0.42, 0.95, 0.4, 0.78], ease: 'sine.inOut' },
          duration: dur,
          transformOrigin: '50% 50%',
        },
        0
      )
      .to(
        motion,
        {
          keyframes: { scaleY: [0.92, 0.86, 0.96, 0.82, 0.78], ease: 'sine.inOut' },
          duration: dur,
          transformOrigin: '50% 50%',
        },
        0
      )
      // depth-of-field: two cheap static blur steps (no per-frame raster)
      .set(motion, { filter: 'blur(0.8px)' }, dur * 0.5)
      .set(motion, { filter: 'blur(1.5px)' }, dur * 0.72)
      // hold opacity then fade into the haze
      .to(motion, { opacity: 0, duration: dur * 0.32, ease: 'power2.in' }, dur * 0.68)

    // the final petal planes in slow-motion — the time-warp
    if (fallScale !== 1) fl.timeScale(fallScale)
  }
}
