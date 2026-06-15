/* L3 — the marguerite herself. Renders the procedural watercolor SVG, drives
   her idle life, owns the pooled particle system, and handles tap-to-pluck:
   each petal squashes, snaps, is promoted into world space and planes down,
   firing synchronized sound / word / pollen / ripple / haptics / heartbeat.
   The final petal triggers the time-warp + bloom that hands off the verdict. */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import gsap from '../lib/gsapSetup.js'
import { startIdle } from '../lib/idle.js'
import { createParticles } from '../lib/particles.js'
import { pluckPetal } from '../lib/petalChoreography.js'
import { wordAt } from '../lib/phrases.js'

const Daisy = forwardRef(function Daisy(
  { model, phase, reduced, audio, haptics, vec, onPluck, onShake, onVerdict, onTimewarp },
  ref
) {
  const { center, view, heartR, petals, pollen, stem, leaves } = model
  const total = model.petalCount

  // group refs
  const flowerRef = useRef(null)
  const corollaRef = useRef(null)
  const coreRef = useRef(null)
  const coreGlowRef = useRef(null)
  const stemRef = useRef(null)
  const shadowRef = useRef(null)
  const petalsGroupRef = useRef(null)
  const fxRef = useRef(null)
  const fallingRef = useRef(null)
  const waveRef = useRef(null)

  // mutable state shared with imperative handlers
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const activeRef = useRef(false)
  const pluckedRef = useRef(0)
  const pluckingRef = useRef(new Set())
  const elsRef = useRef({ anchors: [], inners: [], paths: [] })
  const idleRef = useRef(null)
  const particlesRef = useRef(null)

  // ---- setup once on mount -------------------------------------------
  useEffect(() => {
    const group = petalsGroupRef.current
    const anchors = Array.from(group.querySelectorAll('.petal-anchor'))
    const inners = Array.from(group.querySelectorAll('.petal'))
    const paths = Array.from(group.querySelectorAll('.petal-path'))
    elsRef.current = { anchors, inners, paths }

    // place each petal at the center, rotated outward; closed (scale 0) until
    // the ritual blooms it open (also re-blooms on replay, when Daisy remounts)
    anchors.forEach((a, i) => {
      gsap.set(a, {
        x: center.x,
        y: center.y,
        rotation: petals[i].angleDeg,
        transformOrigin: '50% 100%',
        scale: 0,
        force3D: true,
      })
    })

    particlesRef.current = createParticles(fxRef.current)

    // idle uses a live array where plucked petals become null
    const petalEls = inners.slice()
    idleRef.current = startIdle({
      flowerEl: flowerRef.current,
      corollaEl: corollaRef.current,
      coreEl: coreRef.current,
      coreGlowEl: coreGlowRef.current,
      stemEl: stemRef.current,
      shadowEl: shadowRef.current,
      petalEls,
      model,
      vec,
      reduced: () => reducedRef.current,
    })
    // expose the mutable petalEls so pluck() can null entries
    elsRef.current.petalEls = petalEls

    return () => {
      idleRef.current && idleRef.current.stop()
      particlesRef.current && particlesRef.current.dispose()
      gsap.killTweensOf(anchors)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- phase: open the flower & arm plucking -------------------------
  useEffect(() => {
    activeRef.current = phase === 'ritual'
    if (phase === 'ritual') {
      const anchors = elsRef.current.anchors
      if (reducedRef.current) {
        gsap.to(anchors, { scale: 1, duration: 0.5, stagger: 0.008, ease: 'power2.out' })
      } else {
        gsap.to(anchors, {
          scale: 1,
          duration: 0.95,
          ease: 'back.out(1.7)',
          stagger: { each: 0.016, from: 'center' },
          transformOrigin: '50% 100%',
        })
      }
    }
    if (phase === 'verdict') {
      // ritual's over and the card covers the scene — stop the idle ticker
      idleRef.current && idleRef.current.stop()
    }
  }, [phase])

  // tap-anywhere + keyboard plucking, exposed to the parent: the scene listens
  // for taps and asks the flower to drop the petal nearest the tap.
  useImperativeHandle(ref, () => ({ pluckAt, pluckNext }), [])

  // ---- the synchronized burst fired at each petal's snap -------------
  function onSnap(bp, isLast) {
    pluckedRef.current += 1
    const count = pluckedRef.current
    const entry = wordAt(count - 1)
    const intensity = entry.intensity

    audio && audio.pluck({ progress: count / total, intensity, last: isLast })
    audio && audio.playWord(entry.id, intensity)
    if (haptics) (isLast ? haptics.lastPluck() : haptics.pluck(0.4 + 0.5 * intensity))

    const ctl = idleRef.current
    ctl && ctl.pulseCore()
    ctl && ctl.lighten(Math.max(0, (total - count) / total))

    if (bp && !reducedRef.current && particlesRef.current) {
      particlesRef.current.emitPollen(bp.x, bp.y, 8, { color: '#E8A33D' })
      particlesRef.current.rippleAt(bp.x, bp.y, { color: '#F2C879', max: 92 })
    }
    if (!reducedRef.current && !isLast) onShake && onShake()
    if (isLast && !reducedRef.current) onTimewarp && onTimewarp(true)
    onPluck && onPluck({ count, total })
  }

  // ---- the verdict bloom (after the last petal lands) ----------------
  function bloomVerdict() {
    const entry = wordAt(total - 1)
    // the verdict zoom takes ownership of the flower; stop the idle from
    // fighting its svgOrigin every frame, and lift the time-warp veil.
    idleRef.current && idleRef.current.freezeFlower()
    onTimewarp && onTimewarp(false)
    const wave = waveRef.current
    if (wave) {
      gsap.set(wave, { opacity: 0, scale: 1, svgOrigin: `${center.x} ${center.y}` })
      gsap.to(wave, { opacity: 0.6, scale: 6.5, duration: 0.7, ease: 'power2.out' })
      gsap.to(wave, { opacity: 0, duration: 0.85, delay: 0.45 })
    }
    if (!reducedRef.current) {
      gsap.to(flowerRef.current, {
        scale: 1.3,
        duration: 1.05,
        ease: 'power2.inOut',
        svgOrigin: `${center.x} ${center.y}`,
      })
      particlesRef.current &&
        particlesRef.current.verdictRain(center.x, center.y + 8, 44, { color: '#F2C879' })
    }
    audio && audio.verdict({ moodId: entry.id, intensity: entry.intensity })
    haptics && haptics.verdict(entry.intensity)
    gsap.delayedCall(reducedRef.current ? 0.25 : 1.05, () => {
      onVerdict && onVerdict({ wordId: entry.id })
    })
  }

  // ---- pluck one petal -----------------------------------------------
  function pluck(i) {
    if (!activeRef.current) return
    if (pluckingRef.current.has(i)) return
    const { anchors, paths, petalEls } = elsRef.current
    const anchor = anchors[i]
    const path = paths[i]
    if (!anchor || !path) return
    pluckingRef.current.add(i)
    if (petalEls) petalEls[i] = null // idle stops touching it

    // deterministic at tap time (size counts distinct engaged petals),
    // independent of when onSnap later increments pluckedRef
    const isLast = pluckingRef.current.size >= total
    const slow = isLast && !reducedRef.current

    pluckPetal({
      pathEl: path,
      anchorEl: anchor,
      fallingGroup: fallingRef.current,
      reduced: reducedRef.current,
      fallScale: slow ? 0.42 : 1,
      onSnap: (bp) => onSnap(bp, isLast),
      onComplete: () => {
        if (isLast) bloomVerdict()
      },
    })
  }

  // keyboard / assistive tech: one control plucks the next available petal,
  // so screen-reader users get a single clear affordance (not 37 tab stops)
  function pluckNext() {
    if (!activeRef.current) return
    const { anchors } = elsRef.current
    for (let i = 0; i < anchors.length; i++) {
      if (anchors[i] && anchors[i].isConnected && !pluckingRef.current.has(i)) {
        pluck(i)
        return
      }
    }
  }

  // tap anywhere on the scene: detach the petal nearest the tap point, so no
  // precision is needed. Falls back to the next petal if distances are unusable.
  function pluckAt(clientX, clientY) {
    if (!activeRef.current) return
    const { anchors } = elsRef.current
    let best = -1
    let bestD = Infinity
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i]
      if (!a || !a.isConnected || pluckingRef.current.has(i)) continue
      const r = a.getBoundingClientRect()
      const dx = r.left + r.width / 2 - clientX
      const dy = r.top + r.height / 2 - clientY
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    if (best >= 0) pluck(best)
    else pluckNext()
  }

  // ---- render ---------------------------------------------------------
  return (
    <>
    <svg
      className="daisy-svg"
      viewBox={`0 0 ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="petalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDFBF6" />
          <stop offset="0.5" stopColor="#FBF7EF" />
          <stop offset="0.82" stopColor="#F0E2D2" />
          <stop offset="1" stopColor="#EAD9C4" />
        </linearGradient>
        <radialGradient id="heartGrad" cx="0.42" cy="0.38" r="0.72">
          <stop offset="0" stopColor="#F6D58C" />
          <stop offset="0.55" stopColor="#E5A33C" />
          <stop offset="1" stopColor="#D2851F" />
        </radialGradient>
        <radialGradient id="heartGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F8DDA6" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#F2C879" stopOpacity="0.4" />
          <stop offset="1" stopColor="#F2C879" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="stemGrad"
          gradientUnits="userSpaceOnUse"
          x1={center.x}
          y1={center.y}
          x2={center.x}
          y2={view.h}
        >
          <stop offset="0" stopColor="#8AA06E" />
          <stop offset="1" stopColor="#BFD2A6" />
        </linearGradient>
        <filter id="watercolor" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.013"
            numOctaves="1"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="disp"
          />
          <feGaussianBlur in="disp" stdDeviation="0.4" />
        </filter>
      </defs>

      {/* ground / contact shadow (behind everything, never sways with flower) */}
      <ellipse
        ref={shadowRef}
        className="daisy-shadow"
        cx={center.x + 8}
        cy={center.y + 96}
        rx="104"
        ry="24"
        fill="#93A877"
        opacity="0.16"
      />

      <g ref={flowerRef} className="flower">
        <path
          ref={stemRef}
          className="stem"
          d={stem}
          fill="none"
          stroke="url(#stemGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {leaves.map((d, i) => (
          <path key={`leaf-${i}`} className="leaf" d={d} fill="url(#stemGrad)" opacity="0.92" />
        ))}

        <g ref={corollaRef} className="corolla">
          <g ref={petalsGroupRef} className="petals">
            {petals.map((p) => (
              <g className="petal-anchor" key={p.index}>
                <g className="petal">
                  <path
                    className="petal-path"
                    data-index={p.index}
                    aria-hidden="true"
                    d={p.pathD}
                    fill="url(#petalGrad)"
                    filter="url(#watercolor)"
                  />
                </g>
              </g>
            ))}
          </g>

          <g ref={coreRef} className="core">
            <circle
              ref={coreGlowRef}
              className="core-glow"
              cx={center.x}
              cy={center.y}
              r={heartR * 2.5}
              fill="url(#heartGlow)"
              opacity="0.5"
            />
            <circle className="heart" cx={center.x} cy={center.y} r={heartR} fill="url(#heartGrad)" />
            {pollen.map((pt, i) => (
              <circle
                key={`po-${i}`}
                className="heart-pollen"
                cx={center.x + pt.dx}
                cy={center.y + pt.dy}
                r={pt.r}
                fill={pt.fill}
                opacity={pt.baseOpacity}
                style={{ animationDelay: `-${((pt.phase / (2 * Math.PI)) * 3.2).toFixed(2)}s` }}
              />
            ))}
            <circle
              className="heart-spec"
              cx={center.x - heartR * 0.34}
              cy={center.y - heartR * 0.34}
              r={heartR * 0.5}
              fill="#FFFFFF"
              opacity="0.18"
            />
          </g>
        </g>

        {/* verdict light wave, hidden until the last petal */}
        <circle
          ref={waveRef}
          className="bloom-wave"
          cx={center.x}
          cy={center.y}
          r={heartR}
          fill="url(#heartGlow)"
          opacity="0"
        />
      </g>

      {/* world-space fx + detached petals (managed imperatively) */}
      <g ref={fxRef} className="fx" />
      <g ref={fallingRef} className="falling" />
    </svg>
    {phase === 'ritual' && (
      <button
        className="pluck-key"
        type="button"
        onClick={pluckNext}
        aria-label="Détacher un pétale"
      >
        Détacher un pétale
      </button>
    )}
    </>
  )
})

export default Daisy
