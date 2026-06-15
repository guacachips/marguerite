/* =========================================================================
   idle.js — the flower is never still. One gsap.ticker callback drives every
   idle motion with time-based sine math at mutually-incommensurate periods
   (so it never visibly loops): breathing, sway, stem sway, per-petal shiver,
   core glow, pointer/tilt parallax, and the sympathetic "heartbeat" on pluck.
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
  // when a tween (e.g. the verdict zoom) takes ownership of flowerEl, the idle
  // stops writing its transform/origin so it can't fight the tween every frame.
  let flowerFrozen = false

  // Pre-pose each petal's origin ONCE and use a rotation quickSetter per frame
  // (far cheaper than a full gsap.set with transformOrigin recompute × up to 37).
  const petalRot = petalEls.map((el) => {
    if (!el) return null
    gsap.set(el, { transformOrigin: '50% 100%' })
    return gsap.quickSetter(el, 'rotation', 'deg')
  })

  const update = () => {
    const t = gsap.ticker.time - t0
    const isReduced = reduced()

    // ---- breathing (always, gentler when reduced) ----------------------
    const breath = Math.sin(t * (TAU / 4.2))
    const amt = isReduced ? 0.004 : 0.009
    gsap.set(corollaEl, {
      scale: 1 + amt + breath * amt,
      svgOrigin: `${cx} ${cy}`,
      force3D: true,
    })

    // ---- core glow ------------------------------------------------------
    if (coreGlowEl) {
      const g = 0.46 + (isReduced ? 0 : 0.05 * breath) + glowBeat
      gsap.set(coreGlowEl, {
        opacity: Math.min(1, g),
        scale: 1 + glowBeat * 0.45,
        svgOrigin: `${cx} ${cy}`,
      })
    }
    glowBeat *= 0.9

    if (isReduced) {
      if (!flowerFrozen) gsap.set(flowerEl, { rotation: 0, x: 0, y: 0 })
      return
    }

    const px = vec.current.cx
    const py = vec.current.cy
    const sway = Math.sin(t * (TAU / 6.0))

    // ---- whole-flower sway + parallax tilt (around stem base) ----------
    if (!flowerFrozen) {
      gsap.set(flowerEl, {
        rotation: sway * 1.5 + px * 1.1,
        x: px * 7,
        y: py * 4,
        svgOrigin: `${cx} ${baseOriginY}`,
        force3D: true,
      })
    }

    // ---- stem's own slow sway ------------------------------------------
    if (stemEl) {
      const stemSway = Math.sin(t * (TAU / 7.0) + 1.3)
      gsap.set(stemEl, {
        rotation: stemSway * 2.0,
        svgOrigin: `${cx} ${cy + model.heartR}`,
      })
    }

    // ---- ground shadow deforms with sway -------------------------------
    if (shadowEl) {
      gsap.set(shadowEl, { scaleX: 1 + sway * 0.03, x: sway * 4 })
    }

    // ---- per-petal shiver (skip plucked) -------------------------------
    for (let i = 0; i < petalEls.length; i++) {
      const setter = petalRot[i]
      if (!petalEls[i] || !setter) continue
      const p = model.petals[i]
      setter(Math.sin(t * (TAU / p.swayPeriod) + p.swayPhase) * p.swayAmp)
    }
  }

  gsap.ticker.add(update)

  return {
    stop() {
      gsap.ticker.remove(update)
    },
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
    /** When the flower loses a petal it lightens — shadow contracts a touch.
        Writes scaleY/opacity only; the idle loop owns scaleX/x, so they never
        fight over the same transform component. */
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
    /** Hand flowerEl to an owning tween (the verdict zoom): the idle stops
        writing rotation/x/y/svgOrigin and neutralizes them so the tween's own
        svgOrigin (the heart) composes the matrix cleanly. */
    freezeFlower() {
      flowerFrozen = true
      gsap.set(flowerEl, { rotation: 0, x: 0, y: 0 })
    },
  }
}
