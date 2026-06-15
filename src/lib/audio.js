/* =========================================================================
   audio.js — the synthesized sound world (Tone.js), zero external assets.
   A shared reverb bus, an evolving suspended pad, a rising pentatonic pluck
   per petal (tension climbing toward the verdict), a paper rustle, sparkle,
   a breathed word tone, and a verdict resolution. Everything lives behind a
   user gesture; degrades gracefully when WebAudio is unavailable.
   ========================================================================= */
import * as Tone from 'tone'

const STORE_KEY = 'marguerite.muted'

// Rising C-major pentatonic ladder — the pluck climbs it across the run.
const PLUCK_LADDER = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7']

// Pad voicing: a wide, suspended C add9 that just hangs in the air.
const PAD_CHORD = ['C2', 'G2', 'C3', 'E3', 'D4']
const PAD_WARM = ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'] // verdict: warmer, fuller
const PAD_MINOR = ['A1', 'E2', 'A2', 'C3', 'E3', 'B3'] // "pas du tout": bittersweet

// Word fundamentals (gentle breath under each cycle word).
const WORD_NOTE = {
  'un-peu': 'E4',
  beaucoup: 'G4',
  passionnement: 'A4',
  'a-la-folie': 'C5',
  'pas-du-tout': 'D4',
}

function readMuted() {
  try {
    return localStorage.getItem(STORE_KEY) === '1'
  } catch {
    return false
  }
}

export class AudioEngine {
  constructor() {
    this.started = false
    this.muted = readMuted()
    this._pluckN = 0
    this._lastMono = 0
    this.nodes = []
  }

  _track(node) {
    this.nodes.push(node)
    return node
  }

  /** Strictly-increasing time for monophonic synths to avoid Tone errors. */
  _monoTime() {
    const t = Math.max(Tone.now(), this._lastMono + 0.02)
    this._lastMono = t
    return t
  }

  /** Build the graph once, after Tone.start() has resumed the context. */
  async ensureStarted() {
    if (this.started) return
    await Tone.start()
    Tone.getDestination().mute = this.muted

    // ---- master bus: everything → reverb → limiter → out ----------------
    this.masterVol = this._track(new Tone.Volume(0))
    this.limiter = this._track(new Tone.Limiter(-1))
    this.reverb = this._track(
      new Tone.Reverb({ decay: 9, preDelay: 0.04, wet: 0.3 })
    )
    this.busIn = this._track(new Tone.Gain(1))
    this.busIn.connect(this.reverb)
    this.reverb.connect(this.limiter)
    this.limiter.connect(this.masterVol)
    this.masterVol.toDestination()
    // Reverb builds its impulse async; wait so the first sound is spaced.
    try {
      await this.reverb.ready
    } catch {
      /* older Tone may not expose .ready — fine */
    }

    // ---- pluck delay aux ------------------------------------------------
    this.delay = this._track(
      new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.26, wet: 0.3 })
    )
    this.delay.connect(this.busIn)

    // ---- evolving pad (nappe) ------------------------------------------
    this.padGain = this._track(new Tone.Gain(0))
    this.autoFilter = this._track(
      new Tone.AutoFilter({
        frequency: 0.06,
        depth: 0.4,
        baseFrequency: 220,
        octaves: 3,
        wet: 1,
      }).start()
    )
    this.padFilter = this._track(
      new Tone.Filter({ type: 'lowpass', frequency: 1300, Q: 0.3 })
    )
    this.pad = this._track(
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1.4,
        modulationIndex: 3,
        oscillator: { type: 'sine' },
        modulation: { type: 'sine' },
        envelope: { attack: 4, decay: 2, sustain: 0.6, release: 7 },
        modulationEnvelope: { attack: 5, decay: 2, sustain: 0.5, release: 7 },
        volume: -24,
      })
    )
    this.pad.maxPolyphony = 8
    this.pad.chain(this.padFilter, this.autoFilter, this.padGain, this.busIn)

    // ---- pluck pool (Karplus-Strong harp/kalimba) ----------------------
    this.pluckVoices = []
    for (let i = 0; i < 4; i++) {
      const v = this._track(
        new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.92,
          release: 1.4,
        })
      )
      v.volume.value = -10
      v.connect(this.busIn)
      v.connect(this.delay)
      this.pluckVoices.push(v)
    }
    this._pluckIdx = 0

    // ---- woody "pop" at the moment of detachment -----------------------
    this.pop = this._track(
      new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      })
    )
    this.pop.volume.value = -19
    this.pop.connect(this.busIn)

    // ---- ASMR paper rustle ---------------------------------------------
    this.rustleFilter = this._track(
      new Tone.Filter({ type: 'bandpass', frequency: 3000, Q: 1.5 })
    )
    this.rustleFilter.connect(this.busIn)
    this.rustle = this._track(
      new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.08 },
      })
    )
    this.rustle.volume.value = -22
    this.rustle.connect(this.rustleFilter)

    // ---- pollen sparkle (soft high sines) ------------------------------
    this.sparkleHP = this._track(
      new Tone.Filter({ type: 'highpass', frequency: 1500 })
    )
    this.sparkleHP.connect(this.busIn)
    this.sparkle = this._track(
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.3 },
        volume: -25,
      })
    )
    this.sparkle.maxPolyphony = 6
    this.sparkle.connect(this.sparkleHP)

    // ---- breathed word tone --------------------------------------------
    this.wordSynth = this._track(
      new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.06, decay: 0.2, sustain: 0.3, release: 1.0 },
        volume: -21,
      })
    )
    this.wordSynth.connect(this.busIn)

    // ---- verdict bell + tremolo ----------------------------------------
    this.tremolo = this._track(
      new Tone.Tremolo({ frequency: 6, depth: 0 }).start()
    )
    this.tremolo.connect(this.busIn)
    this.bell = this._track(
      new Tone.FMSynth({
        harmonicity: 0.5,
        modulationIndex: 1.2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 1, sustain: 0.2, release: 6 },
        modulationEnvelope: { attack: 0.2, decay: 1, sustain: 0.1, release: 5 },
        volume: -14,
      })
    )
    this.bell.connect(this.tremolo)

    this.started = true
  }

  /** Begin (or reset) the ambient pad — also used on replay to return the
      sound world to its calm baseline after a verdict colored it. */
  async startAmbience() {
    await this.ensureStarted()
    try {
      const now = Tone.now()
      this.pad.releaseAll(now)
      this.padFilter.frequency.cancelScheduledValues(now)
      this.padFilter.frequency.rampTo(1300, 1.5)
      this.reverb.wet.rampTo(0.3, 1.2)
      this.tremolo.depth.rampTo(0, 0.4)
      this.pad.triggerAttack(PAD_CHORD, now + 0.05)
      this.padGain.gain.cancelScheduledValues(now)
      this.padGain.gain.rampTo(0.9, 3)
    } catch {
      /* ignore */
    }
  }

  stopAmbience() {
    if (!this.started) return
    try {
      this.padGain.gain.rampTo(0, 1.2)
      this.pad.releaseAll()
    } catch {
      /* ignore */
    }
  }

  /**
   * One petal released.
   * @param {{progress:number, intensity:number, last:boolean}} o
   *   progress 0..1 across the whole flower drives the rising pitch.
   */
  pluck({ progress = 0, intensity = 0.5, last = false } = {}) {
    if (!this.started) return
    try {
      const idx = Math.min(
        PLUCK_LADDER.length - 1,
        Math.round(progress * (PLUCK_LADDER.length - 1))
      )
      const note = PLUCK_LADDER[idx]
      const vel = 0.7 + 0.2 * Math.min(1, Math.max(0, intensity))
      const voice = this.pluckVoices[this._pluckIdx]
      this._pluckIdx = (this._pluckIdx + 1) % this.pluckVoices.length
      const t = Tone.now() + 0.001
      // organic detune by nudging the resonance string note micro-cents
      voice.triggerAttack(note, t, vel)

      // woody pop + paper rustle ride the same instant
      this.pop.triggerAttackRelease('C2', '16n', this._monoTime(), 0.5)
      this.rustleFilter.frequency.value = 2600 + progress * 1400
      this.rustle.triggerAttackRelease('16n', this._monoTime(), 0.5 + 0.3 * intensity)

      // sparkle roughly one pluck in three
      this._pluckN += 1
      if (last || this._pluckN % 3 === 0) {
        const hi = ['C7', 'E7', 'G6', 'D7']
        const a = hi[this._pluckN % hi.length]
        this.sparkle.triggerAttackRelease(a, '32n', Tone.now() + 0.005, 0.35)
      }
    } catch {
      /* never let audio break the ritual */
    }
  }

  /** A soft breath under the cycle word. */
  playWord(wordId, intensity = 0.5) {
    if (!this.started) return
    try {
      const note = WORD_NOTE[wordId] || 'G4'
      this.wordSynth.triggerAttackRelease(note, '4n', this._monoTime(), 0.4 + 0.3 * intensity)
    } catch {
      /* ignore */
    }
  }

  /**
   * The verdict — suspension then resolution, colored by the landed word.
   * @param {{moodId:string, intensity:number}} o
   */
  verdict({ moodId = 'beaucoup', intensity = 0.6 } = {}) {
    if (!this.started) return
    try {
      const now = Tone.now()
      const folie = moodId === 'a-la-folie'
      const none = moodId === 'pas-du-tout'

      // open the room, close the pad's brightness — time suspends
      this.reverb.wet.rampTo(0.62, 1.2)
      this.padFilter.frequency.rampTo(600, 1.4)

      // slide the pad toward a warmer (or bittersweet) chord
      this.pad.releaseAll(now)
      const chord = none ? PAD_MINOR : PAD_WARM
      this.pad.triggerAttack(chord, now + 0.25)
      this.padGain.gain.rampTo(1.0, 1.5)

      // exaltation for "à la folie"
      this.tremolo.depth.rampTo(folie ? 0.45 : 0, 0.4)

      // grave bell — a deep breath
      this.bell.triggerAttackRelease(none ? 'A2' : 'C3', '1m', now + 0.3, 0.8)

      // descending arpeggio on the pluck pool
      const arp = none
        ? ['A5', 'E5', 'C5', 'A4', 'E4']
        : ['C6', 'G5', 'E5', 'C5', 'G4']
      arp.forEach((n, i) => {
        const v = this.pluckVoices[i % this.pluckVoices.length]
        v.triggerAttack(n, now + 0.5 + i * 0.12, 0.6)
      })

      // a final rising glimmer for the ecstatic verdicts
      if (intensity >= 0.8) {
        ;['G6', 'C7', 'E7'].forEach((n, i) =>
          this.sparkle.triggerAttackRelease(n, '16n', now + 1.0 + i * 0.09, 0.3)
        )
      }
    } catch {
      /* ignore */
    }
  }

  /** The opening pluck when the CTA is pressed. */
  bloom() {
    if (!this.started) return
    try {
      this.pluckVoices[0].triggerAttack('G4', Tone.now() + 0.01, 0.6)
      this.sparkle.triggerAttackRelease('C6', '16n', Tone.now() + 0.06, 0.3)
    } catch {
      /* ignore */
    }
  }

  setMuted(muted) {
    this.muted = muted
    try {
      localStorage.setItem(STORE_KEY, muted ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (this.started) Tone.getDestination().mute = muted
  }

  isMuted() {
    return this.muted
  }

  dispose() {
    try {
      this.nodes.forEach((n) => n.dispose && n.dispose())
    } catch {
      /* ignore */
    }
    this.nodes = []
    this.started = false
  }
}
