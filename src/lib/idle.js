/* =========================================================================
   idle.js — the flower's living motion. One gsap.ticker callback drives every
   idle movement with time-based sine math at mutually-incommensurate periods
   (so it never visibly loops): breathing, sway, stem sway, per-petal shiver,
   core glow, pointer parallax, and the sympathetic "heartbeat" on pluck.

   PERF: the loop is PAUSED by default and only runs during the ritual (the
   closed bud doesn't need to breathe at 60fps behind the intro). Transform
   ORIGINS are posed once at setup — never re-passed per frame — so GSAP never
   re-derives the SVG matrix pin, and the filtered subtree isn't needlessly
   invalidated. Both changes were driven by on-device profiling.
   ========================================================================= */
import gsap from './gsapSetup.js'

const TAU = Math.PI * 2

/**
 * @param {object} refs  see Daisy.jsx for the wiring.
 *   reduced: () => boolean (prefers-reduced-motion)
 *   vec: smoothed parallax pointer ref
 *   petalEls: array of inner petal <g>, entries become null when plucked
 */
export function startIdle(refs) {
  const {
    flowerEl,
    corollaEl,
    coreEl,
    coreGlowEl,
    stemEl,
    shadowEl,
    petalEls,
    model,
    vec,
    reduced,
  } = refs

  const cx = model.center.x
  const cy = model.center.y
  const baseOriginY = model.view.h
  const t0 = gsap.ticker.time
  let glowBeat = 0
  let flowerFrozen = false

  // ---- pose all transform origins ONCE (constant) --------------------
  gsap.set(corollaEl, { svgOrigin: `${cx} ${cy}` })
  gsap.set(flowerEl, { svgOrigin: `${cx} ${baseOriginY}` })
  if (coreGlowEl) gsap.set(coreGlowEl, { svgOrigin: `${cx} ${cy}` })
  if (stemEl) gsap.set(stemEl, { svgOrigin: `${cx} ${cy + model.heartR}` })

  // pre-pose each petal's origin once; animate only rotation via a quickSetter
  const petalRot = petalEls.map((el) => {
    if (!el) return null
    gsap.set(el, { transformOrigin: '50% 100%' })
    return gsap.quickSetter(el, 'rotation', 'deg')
  })

  const update = () => {
    const t = gsap.ticker.time - t0
    const isReduced = reduced()

    // ---- breathing (origin already posed) ------------------------------
    const breath = Math.sin(t * (TAU / 4.2))
    const amt = isReduced ? 0.004 : 0.009
    gsap.set(corollaEl, { scale: 1 + amt + breath * amt, force3D: true })

    // ---- core glow ------------------------------------------------------
    if (coreGlowEl) {
      const g = 0.46 + (isReduced ? 0 : 0.05 * breath) + glowBeat
      gsap.set(coreGlowEl, { opacity: Math.min(1, g), scale: 1 + glowBeat * 0.45 })
    }
    glowBeat *= 0.9

    if (isReduced) {
      if (!flowerFrozen) gsap.set(flowerEl, { rotation: 0, x: 0, y: 0 })
      return
    }

    const px = vec.current.cx
    const py = vec.current.cy
    const sway = Math.sin(t * (TAU / 6.0))

    // ---- whole-flower sway + parallax tilt -----------------------------
    if (!flowerFrozen) {
      gsap.set(flowerEl, { rotation: sway * 1.5 + px * 1.1, x: px * 7, y: py * 4, force3D: true })
    }

    // ---- stem's own slow sway ------------------------------------------
    if (stemEl) {
      const stemSway = Math.sin(t * (TAU / 7.0) + 1.3)
      gsap.set(stemEl, { rotation: stemSway * 2.0 })
    }

    // ---- ground shadow deforms with sway -------------------------------
    if (shadowEl) gsap.set(shadowEl, { scaleX: 1 + sway * 0.03, x: sway * 4 })

    // ---- per-petal shiver (skip plucked) -------------------------------
    for (let i = 0; i < petalEls.length; i++) {
      const setter = petalRot[i]
      if (!petalEls[i] || !setter) continue
      const p = model.petals[i]
      setter(Math.sin(t * (TAU / p.swayPeriod) + p.swayPhase) * p.swayAmp)
    }
  }

  // ---- gated lifecycle: only spin the ticker while the flower is alive --
  let running = false
  function resume() {
    if (!running) {
      gsap.ticker.add(update)
      running = true
    }
  }
  function pause() {
    if (running) {
      gsap.ticker.remove(update)
      running = false
    }
  }

  return {
    resume,
    pause,
    stop: pause,
    /** Sympathetic heartbeat: the core flinches + glow flashes on each pluck. */
    pulseCore(strength = 0.38) {
      glowBeat = Math.min(0.6, glowBeat + strength)
      if (!reduced() && coreEl) {
        gsap.to(coreEl, {
          keyframes: [
            { scale: 0.97, duration: 0.06 },
            { scale: 1.04, duration: 0.1 },
            { scale: 1, duration: 0.13 },
          ],
          svgOrigin: `${cx} ${cy}`,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
    },
    /** When the flower loses a petal it lightens — shadow contracts a touch. */
    lighten(fraction) {
      if (!shadowEl) return
      gsap.to(shadowEl, {
        scaleY: 0.78 + 0.22 * fraction,
        opacity: 0.08 + 0.08 * fraction,
        duration: 0.6,
        ease: 'power2.out',
        transformOrigin: '50% 50%',
      })
    },
    /** Hand flowerEl to an owning tween (the verdict zoom). */
    freezeFlower() {
      flowerFrozen = true
      gsap.set(flowerEl, { rotation: 0, x: 0, y: 0 })
    },
  }
}
