import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import gsap from './lib/gsapSetup.js'
import { generateDaisy } from './lib/daisy.js'
import { randomSeed } from './lib/random.js'
import { CYCLE, wordAt, COPY } from './lib/phrases.js'
import { AudioEngine } from './lib/audio.js'
import { useHaptics } from './hooks/useHaptics.js'
import { useReducedMotion } from './lib/useReducedMotion.js'
import { useParallax } from './lib/useParallax.js'
import Stage from './components/Stage.jsx'
import Backdrop from './components/Backdrop.jsx'
import Meadow from './components/Meadow.jsx'
import Daisy from './components/Daisy.jsx'
import WordBand from './components/WordBand.jsx'
import IntroScreen from './components/IntroScreen.jsx'
import VerdictCard from './components/VerdictCard.jsx'
import ControlsBar from './components/ControlsBar.jsx'

export default function App() {
  // one audio engine for the whole session
  const audioRef = useRef(null)
  if (!audioRef.current) audioRef.current = new AudioEngine()
  const audio = audioRef.current

  const reduced = useReducedMotion()
  const haptics = useHaptics(true)
  const parallax = useParallax(!reduced)

  const [seed, setSeed] = useState(() => randomSeed())
  const [phase, setPhase] = useState('intro') // intro | ritual | verdict
  const [showIntro, setShowIntro] = useState(true)
  const [pluckedCount, setPluckedCount] = useState(0)
  const [verdictEntry, setVerdictEntry] = useState(null)
  const [timewarp, setTimewarp] = useState(false)
  const [resting, setResting] = useState(false)
  const [muted, setMuted] = useState(() => audio.isMuted())

  const model = useMemo(() => generateDaisy(seed), [seed])
  const sceneRef = useRef(null)
  const daisyRef = useRef(null)

  const currentWord = pluckedCount > 0 ? wordAt(pluckedCount - 1) : null

  // ---- begin: wake audio + bloom (must run inside the click gesture) --
  const handleStart = useCallback(() => {
    haptics.start()
    audio
      .ensureStarted()
      .then(() => {
        audio.startAmbience()
        audio.bloom()
      })
      .catch(() => {})
    setPhase('ritual')
  }, [audio, haptics])

  const handlePluck = useCallback(({ count }) => {
    setPluckedCount(count)
  }, [])

  const handleShake = useCallback(() => {
    const el = sceneRef.current
    if (!el) return
    gsap.killTweensOf(el)
    gsap.fromTo(
      el,
      { x: 0, y: 0, rotation: 0 },
      {
        keyframes: [
          { x: -3, y: 2, rotation: -0.4, duration: 0.03 },
          { x: 3, y: -2, rotation: 0.4, duration: 0.03 },
          { x: -2, y: 1, rotation: -0.2, duration: 0.03 },
          { x: 0, y: 0, rotation: 0, duration: 0.03 },
        ],
        ease: 'power2.out',
      }
    )
  }, [])

  // a tap anywhere on the scene drops the petal nearest the tap point
  const handleScenePointerDown = useCallback((e) => {
    daisyRef.current?.pluckAt(e.clientX, e.clientY)
  }, [])

  const handleVerdict = useCallback(({ wordId }) => {
    const entry = CYCLE.find((c) => c.id === wordId) || CYCLE[0]
    setVerdictEntry(entry)
    setPhase('verdict')
  }, [])

  const handleReplay = useCallback(() => {
    setSeed(randomSeed())
    setPluckedCount(0)
    setVerdictEntry(null)
    setTimewarp(false)
    setPhase('ritual')
    audio.startAmbience()
  }, [audio])

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      audio.setMuted(next)
      return next
    })
  }, [audio])

  // free CPU/GPU when backgrounded or the screen locks: suspend audio (WebAudio
  // doesn't auto-throttle) and pause CSS animations. rAF — and thus GSAP — already
  // stops on its own when the page is hidden.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        audio.suspend()
        document.body.classList.add('is-hidden')
      } else {
        audio.resume()
        document.body.classList.remove('is-hidden')
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [audio])

  // auto-rest: a couple of seconds after the last tap, let the flower go still
  // (the dominant "heats while you linger" cost). It wakes on the next touch.
  useEffect(() => {
    let timer
    const arm = () => {
      setResting(false)
      clearTimeout(timer)
      timer = setTimeout(() => setResting(true), 1300)
    }
    window.addEventListener('pointerdown', arm, { passive: true })
    arm()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', arm)
    }
  }, [])

  return (
    <Stage
      sceneRef={sceneRef}
      sceneClass={`${phase === 'ritual' ? 'scene--ritual ' : ''}${timewarp ? 'scene--timewarp' : ''}`}
      onScenePointerDown={handleScenePointerDown}
      scene={
        <>
          <Backdrop vec={parallax.vec} />
          <Meadow vec={parallax.vec} reduced={reduced} />
          <Daisy
            key={seed}
            ref={daisyRef}
            model={model}
            phase={phase}
            reduced={reduced}
            audio={audio}
            haptics={haptics}
            vec={parallax.vec}
            onPluck={handlePluck}
            onShake={handleShake}
            onVerdict={handleVerdict}
            onTimewarp={setTimewarp}
            resting={resting}
          />
        </>
      }
      ui={
        <>
          <WordBand wordEntry={phase === 'verdict' ? null : currentWord} reduced={reduced} />
          <div
            className={`hint ${phase === 'ritual' && pluckedCount === 0 ? 'hint--show' : ''}`}
            aria-hidden="true"
          >
            {COPY.pluckHint}
          </div>
          {showIntro && (
            <IntroScreen
              phase={phase}
              onStart={handleStart}
              onExited={() => setShowIntro(false)}
              reduced={reduced}
            />
          )}
          {phase === 'verdict' && verdictEntry && (
            <VerdictCard entry={verdictEntry} onReplay={handleReplay} reduced={reduced} />
          )}
          <ControlsBar muted={muted} onToggleMute={handleToggleMute} />
        </>
      }
    />
  )
}
