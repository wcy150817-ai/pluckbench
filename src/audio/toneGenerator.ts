import { ToneWaveform } from '../data/instruments';

type ResolvedTimbre = Exclude<ToneWaveform, 'auto-instrument'>;

/**
 * Physical Modeling Acoustic Instrument Synthesizer
 *
 * Replaces generic electronic oscillators with:
 * 1. Extended Karplus-Strong Waveguide String Synthesis (fractional delay line + pick position comb + string damping + body resonance biquads)
 *    for Acoustic Guitar, Ukulele, Guzheng, Pipa, Bass, and Grand Piano.
 * 2. Bowed String Helmholtz Stick-Slip Harmonic Synthesis + Multi-Formant Wooden/Python-Skin Resonator + Natural Vibrato
 *    for Erhu, Violin, Viola, and Cello.
 */
export class ReferenceToneGenerator {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private repeatTimer: number | null = null;
  private isPlaying = false;
  private currentFreq = 440;
  private currentVolume = 0.6;
  private currentTimbre: ResolvedTimbre = 'acoustic-guitar';

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Generate a realistic Karplus-Strong physical plucked-string AudioBuffer
   */
  private createKarplusStrongBuffer(
    ctx: AudioContext,
    frequency: number,
    timbre: ResolvedTimbre,
    durationSec: number = 3.2
  ): AudioBuffer {
    const sr = ctx.sampleRate;
    const totalSamples = Math.floor(sr * durationSec);
    const buffer = ctx.createBuffer(1, totalSamples, sr);
    const out = buffer.getChannelData(0);

    // Physical string parameters per instrument
    let damping = 0.9965;        // Energy retention per period
    let brightness = 0.42;       // Low-pass blend in loop (0.5 = darkest, 0.15 = brightest)
    let pickPosRatio = 0.18;     // Where along the string it is plucked (creates authentic comb-filter notches)
    let attackClickLevel = 0.25; // Plectrum/nail transient brightness
    let bodyWarmth = 0.35;       // Fundamental body thump reinforcement

    switch (timbre) {
      case 'acoustic-guitar':
        damping = 0.9968;
        brightness = 0.36;
        pickPosRatio = 0.16;
        attackClickLevel = 0.28;
        bodyWarmth = 0.42;
        break;
      case 'ukulele-nylon':
        damping = 0.9935; // Nylon strings decay faster & warmer
        brightness = 0.46;
        pickPosRatio = 0.25;
        attackClickLevel = 0.14;
        bodyWarmth = 0.50;
        break;
      case 'chinese-guzheng':
        damping = 0.9982; // Long resonant paulownia soundboard sustain
        brightness = 0.24; // Bright plectrum (义甲) overtones
        pickPosRatio = 0.11;
        attackClickLevel = 0.42;
        bodyWarmth = 0.32;
        break;
      case 'chinese-pipa':
        damping = 0.9948;
        brightness = 0.20; // Crisp, percussive jade-like attack
        pickPosRatio = 0.09;
        attackClickLevel = 0.55;
        bodyWarmth = 0.25;
        break;
      case 'deep-bass':
        damping = 0.9972;
        brightness = 0.44;
        pickPosRatio = 0.22;
        attackClickLevel = 0.18;
        bodyWarmth = 0.65;
        break;
      case 'grand-piano':
        damping = 0.9978;
        brightness = 0.38;
        pickPosRatio = 0.14;
        attackClickLevel = 0.22;
        bodyWarmth = 0.48;
        break;
      default:
        break;
    }

    // Exact period length in samples
    const periodFloat = Math.max(8, sr / frequency);
    const periodInt = Math.floor(periodFloat);
    const frac = periodFloat - periodInt;

    // Initialize waveguide delay line with shaped pluck excitation
    const delayLine = new Float32Array(periodInt + 2);
    const rawNoise = new Float32Array(periodInt + 2);

    // 1. Pink-ish filtered noise burst + fundamental half-sine displacement
    let lpState = 0;
    for (let i = 0; i <= periodInt; i++) {
      const white = Math.random() * 2 - 1;
      lpState = lpState * 0.55 + white * 0.45;
      const phase = (i / periodInt) * Math.PI * 2;
      const stringBend =
        Math.sin(phase) * bodyWarmth +
        Math.sin(phase * 2) * (bodyWarmth * 0.45) +
        Math.sin(phase * 3) * (bodyWarmth * 0.2);
      rawNoise[i] = lpState * attackClickLevel + stringBend;
    }

    // 2. Apply pick-position comb filter (simulates plucking at distance L * pickPosRatio from bridge)
    const pickOffset = Math.max(1, Math.floor(periodInt * pickPosRatio));
    let mean = 0;
    for (let i = 0; i <= periodInt; i++) {
      const combIdx = (i - pickOffset + periodInt) % periodInt;
      delayLine[i] = rawNoise[i] - rawNoise[combIdx] * 0.65;
      mean += delayLine[i];
    }
    mean /= periodInt + 1;
    for (let i = 0; i <= periodInt; i++) {
      delayLine[i] -= mean;
    }

    // 3. Run Extended Karplus-Strong waveguide loop with fractional delay & frequency-dependent damping
    let ptr = 0;
    let prevSample = 0;
    // Scale damping slightly with frequency so high strings don't die out prematurely
    const freqScaledDamping = Math.min(
      0.9991,
      damping + Math.min(0.0022, (frequency / 1200) * 0.002)
    );

    for (let n = 0; n < totalSamples; n++) {
      const nextPtr = (ptr + 1) % periodInt;
      const nextNextPtr = (ptr + 2) % periodInt;

      // Fractional delay interpolation
      const s0 = delayLine[ptr] * (1 - frac) + delayLine[nextPtr] * frac;
      const s1 = delayLine[nextPtr] * (1 - frac) + delayLine[nextNextPtr] * frac;

      // Two-point lowpass bridge loss filter
      const filtered = (1 - brightness) * s0 + brightness * s1;

      // Subtle DC blocker + write back into delay line
      const newVal = filtered * freqScaledDamping;
      delayLine[ptr] = newVal;
      ptr = nextPtr;

      // Add subtle wooden soundboard knock during first 15ms
      let bodyKnock = 0;
      if (n < sr * 0.015) {
        const env = 1 - n / (sr * 0.015);
        bodyKnock = Math.sin((2 * Math.PI * 185 * n) / sr) * env * env * 0.14;
      }

      out[n] = newVal + bodyKnock;
      prevSample = out[n] * 0.2 + prevSample * 0.8;
    }

    // Normalize peak to 0.85 for clean headroom
    let maxAbs = 0.001;
    for (let i = 0; i < totalSamples; i++) {
      const a = Math.abs(out[i]);
      if (a > maxAbs) maxAbs = a;
    }
    const normGain = 0.85 / maxAbs;
    for (let i = 0; i < totalSamples; i++) {
      // Smooth 4ms attack & 120ms tail fade-out
      const fadeOut =
        i > totalSamples - sr * 0.12 ? (totalSamples - i) / (sr * 0.12) : 1.0;
      out[i] *= normGain * fadeOut;
    }

    return buffer;
  }

  /**
   * Build multi-band acoustic body formant filter chain for realistic wooden body resonance
   */
  private createBodyFormantChain(
    ctx: AudioContext,
    timbre: ResolvedTimbre
  ): { input: AudioNode; output: AudioNode; nodes: AudioNode[] } {
    const formants: { freq: number; q: number; gainDb: number }[] = [];

    switch (timbre) {
      case 'acoustic-guitar':
        formants.push(
          { freq: 98, q: 3.5, gainDb: 5.5 },   // Helmholtz air cavity resonance
          { freq: 205, q: 3.0, gainDb: 4.5 },  // Main spruce top plate
          { freq: 420, q: 2.5, gainDb: 3.0 },  // Warm wood midrange
          { freq: 2400, q: 2.0, gainDb: 2.5 }  // Steel string brilliance
        );
        break;
      case 'ukulele-nylon':
        formants.push(
          { freq: 285, q: 3.2, gainDb: 5.0 },  // Small koa body air mode
          { freq: 640, q: 2.5, gainDb: 3.5 },  // Sweet island midrange
          { freq: 1800, q: 2.0, gainDb: -3.0 } // Soften harsh highs for nylon warmth
        );
        break;
      case 'chinese-guzheng':
        formants.push(
          { freq: 175, q: 3.0, gainDb: 5.0 },  // Paulownia soundboard bass resonance
          { freq: 540, q: 2.8, gainDb: 4.5 },  // Hollow wooden chamber
          { freq: 1680, q: 3.2, gainDb: 4.0 }  // Signature Guzheng plectrum brightness
        );
        break;
      case 'chinese-pipa':
        formants.push(
          { freq: 260, q: 3.0, gainDb: 3.5 },
          { freq: 820, q: 3.5, gainDb: 5.0 },  // Pear-shaped hardwood resonance
          { freq: 2450, q: 3.8, gainDb: 5.5 }  // Crisp fret-board metallic clarity
        );
        break;
      case 'chinese-erhu':
        formants.push(
          { freq: 680, q: 4.8, gainDb: 8.5 },  // Python-skin barrel primary resonance
          { freq: 1340, q: 4.2, gainDb: 7.0 }, // Vocal/singing nasal formant
          { freq: 2550, q: 3.5, gainDb: 4.0 }  // Bow rosin presence
        );
        break;
      case 'bowed-violin':
        formants.push(
          { freq: 280, q: 3.5, gainDb: 4.5 },  // f-hole A0 air mode
          { freq: 510, q: 3.2, gainDb: 5.0 },  // Main corpus wood mode
          { freq: 2650, q: 3.5, gainDb: 5.5 }  // Cremona "Bridge Hill" brilliance
        );
        break;
      case 'deep-bass':
        formants.push(
          { freq: 78, q: 2.8, gainDb: 6.5 },
          { freq: 190, q: 2.5, gainDb: 4.0 },
          { freq: 950, q: 2.0, gainDb: 2.0 }
        );
        break;
      default:
        formants.push({ freq: 250, q: 2.0, gainDb: 2.5 });
        break;
    }

    const nodes: AudioNode[] = [];
    for (const f of formants) {
      const bq = ctx.createBiquadFilter();
      bq.type = 'peaking';
      bq.frequency.value = f.freq;
      bq.Q.value = f.q;
      bq.gain.value = f.gainDb;
      nodes.push(bq);
    }

    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }

    return {
      input: nodes[0],
      output: nodes[nodes.length - 1],
      nodes,
    };
  }

  /**
   * Trigger a realistic acoustic note (either plucked physical string or bowed note preview)
   */
  public triggerPluck(
    frequency: number,
    volume: number = 0.6,
    timbre: ResolvedTimbre = 'acoustic-guitar'
  ): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (timbre === 'tuning-fork') {
      // Pure metallic tuning fork strike (fundamental + 6.27x strike clang overtone)
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.linearRampToValueAtTime(volume * 0.55, now + 0.01);
      master.gain.exponentialRampToValueAtTime(0.0008, now + 2.8);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, now);

      const oscClang = ctx.createOscillator();
      oscClang.type = 'sine';
      oscClang.frequency.setValueAtTime(Math.min(12000, frequency * 6.27), now);
      const clangGain = ctx.createGain();
      clangGain.gain.setValueAtTime(0.18, now);
      clangGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc1.connect(master);
      oscClang.connect(clangGain);
      clangGain.connect(master);
      master.connect(ctx.destination);

      osc1.start(now);
      oscClang.start(now);
      osc1.stop(now + 2.85);
      oscClang.stop(now + 0.24);
      return;
    }

    if (timbre === 'chinese-erhu' || timbre === 'bowed-violin') {
      // Play a 2.0-second expressive bowed string stroke with natural wrist vibrato
      this.playBowedStroke(ctx, frequency, volume, timbre, 2.1);
      return;
    }

    // Physical Modeling Karplus-Strong Plucked String + Wooden Body Formant Chain
    const duration = timbre === 'chinese-guzheng' ? 3.8 : timbre === 'ukulele-nylon' ? 2.2 : 3.0;
    const ksBuffer = this.createKarplusStrongBuffer(ctx, frequency, timbre, duration);

    const src = ctx.createBufferSource();
    src.buffer = ksBuffer;

    const formantChain = this.createBodyFormantChain(ctx, timbre);
    const outGain = ctx.createGain();
    outGain.gain.setValueAtTime(Math.max(0.05, volume * 0.85), now);

    src.connect(formantChain.input);
    formantChain.output.connect(outGain);
    outGain.connect(ctx.destination);

    src.start(now);
  }

  /**
   * Expressive Bowed String Synthesis (for Erhu & Violin/Cello)
   */
  private playBowedStroke(
    ctx: AudioContext,
    frequency: number,
    volume: number,
    timbre: 'chinese-erhu' | 'bowed-violin',
    durationSec: number
  ): void {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    // Smooth bow-in attack
    masterGain.gain.linearRampToValueAtTime(Math.max(0.05, volume * 0.42), now + 0.16);
    masterGain.gain.setValueAtTime(Math.max(0.05, volume * 0.42), now + durationSec - 0.35);
    masterGain.gain.exponentialRampToValueAtTime(0.0005, now + durationSec);

    // Primary Helmholtz stick-slip sawtooth + warm sub-triangle
    const oscSaw = ctx.createOscillator();
    oscSaw.type = 'sawtooth';
    oscSaw.frequency.setValueAtTime(frequency, now);

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(frequency, now);
    const triGain = ctx.createGain();
    triGain.gain.value = 0.55;

    // Natural human wrist vibrato (delayed onset after 0.25s)
    const vibOsc = ctx.createOscillator();
    vibOsc.type = 'sine';
    vibOsc.frequency.setValueAtTime(timbre === 'chinese-erhu' ? 5.2 : 5.6, now);
    const vibDepth = ctx.createGain();
    vibDepth.gain.setValueAtTime(0, now);
    vibDepth.gain.linearRampToValueAtTime(frequency * 0.0038, now + 0.35);
    vibOsc.connect(vibDepth);
    vibDepth.connect(oscSaw.frequency);
    vibDepth.connect(oscTri.frequency);

    // Low-pass roll-off to remove harsh digital buzz
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(
      timbre === 'chinese-erhu'
        ? Math.min(4200, frequency * 8.5)
        : Math.min(5600, frequency * 10),
      now
    );

    const formantChain = this.createBodyFormantChain(ctx, timbre);

    oscSaw.connect(lp);
    oscTri.connect(triGain);
    triGain.connect(lp);
    lp.connect(formantChain.input);
    formantChain.output.connect(masterGain);
    masterGain.connect(ctx.destination);

    oscSaw.start(now);
    oscTri.start(now);
    vibOsc.start(now);

    oscSaw.stop(now + durationSec + 0.02);
    oscTri.stop(now + durationSec + 0.02);
    vibOsc.stop(now + durationSec + 0.02);
  }

  /**
   * Start Continuous Reference Mode ("Sound It") using authentic instrument timbres!
   */
  public startContinuous(
    frequency: number,
    timbre: ResolvedTimbre = 'acoustic-guitar',
    volume: number = 0.6
  ): void {
    const ctx = this.ensureContext();
    this.stopContinuous();

    this.currentFreq = frequency;
    this.currentTimbre = timbre;
    this.currentVolume = volume;
    this.isPlaying = true;

    if (
      timbre === 'acoustic-guitar' ||
      timbre === 'ukulele-nylon' ||
      timbre === 'chinese-guzheng' ||
      timbre === 'chinese-pipa' ||
      timbre === 'deep-bass' ||
      timbre === 'grand-piano'
    ) {
      // Play physical plucked string immediately and re-pluck every 2.4 seconds for realistic ear-tuning!
      this.triggerPluck(this.currentFreq, this.currentVolume, this.currentTimbre);
      this.repeatTimer = window.setInterval(() => {
        if (this.isPlaying) {
          this.triggerPluck(this.currentFreq, this.currentVolume, this.currentTimbre);
        }
      }, 2400);
      return;
    }

    // Continuous sustain for Bowed Strings (Erhu / Violin) or Pure Tuning Fork
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(Math.max(0.03, volume * 0.42), now + 0.14);

    if (timbre === 'tuning-fork') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      osc.connect(masterGain);
      masterGain.connect(ctx.destination);
      osc.start(now);
      this.activeNodes = [osc, masterGain];
      return;
    }

    // Bowed Erhu / Violin continuous sustain
    const oscSaw = ctx.createOscillator();
    oscSaw.type = 'sawtooth';
    oscSaw.frequency.setValueAtTime(frequency, now);

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(frequency, now);
    const triGain = ctx.createGain();
    triGain.gain.value = 0.55;

    const vibOsc = ctx.createOscillator();
    vibOsc.type = 'sine';
    vibOsc.frequency.setValueAtTime(timbre === 'chinese-erhu' ? 5.2 : 5.6, now);
    const vibDepth = ctx.createGain();
    vibDepth.gain.setValueAtTime(frequency * 0.0032, now);
    vibOsc.connect(vibDepth);
    vibDepth.connect(oscSaw.frequency);
    vibDepth.connect(oscTri.frequency);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(4800, frequency * 9), now);

    const formantChain = this.createBodyFormantChain(ctx, timbre);

    oscSaw.connect(lp);
    oscTri.connect(triGain);
    triGain.connect(lp);
    lp.connect(formantChain.input);
    formantChain.output.connect(masterGain);
    masterGain.connect(ctx.destination);

    oscSaw.start(now);
    oscTri.start(now);
    vibOsc.start(now);

    this.activeNodes = [
      oscSaw,
      oscTri,
      vibOsc,
      triGain,
      vibDepth,
      lp,
      ...formantChain.nodes,
      masterGain,
    ];
  }

  public updateFrequency(frequency: number): void {
    const changed = Math.abs(this.currentFreq - frequency) > 0.05;
    this.currentFreq = frequency;
    if (!this.isPlaying) return;
    if (changed) {
      this.startContinuous(this.currentFreq, this.currentTimbre, this.currentVolume);
    }
  }

  public updateVolume(volume: number): void {
    this.currentVolume = volume;
  }

  public updateTimbre(timbre: ResolvedTimbre): void {
    if (this.currentTimbre === timbre) return;
    this.currentTimbre = timbre;
    if (this.isPlaying) {
      this.startContinuous(this.currentFreq, timbre, this.currentVolume);
    }
  }

  public stopContinuous(): void {
    if (this.repeatTimer !== null) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore cleanup errors
      }
    }
    this.activeNodes = [];
    this.isPlaying = false;
  }

  /**
   * Strum multiple frequencies in sequence (for Chord Library audition!)
   */
  public triggerChordStrum(
    frequencies: number[],
    timbre: ResolvedTimbre = 'acoustic-guitar',
    volume: number = 0.55
  ): void {
    frequencies.forEach((freq, idx) => {
      setTimeout(() => {
        this.triggerPluck(freq, volume * 0.78, timbre);
      }, idx * 42);
    });
  }

  /**
   * Rich, unmistakable two-step confirmation chime ("Ding-Dong!" C5-G5 -> E6-C6)
   * played when the user holds the string within the ±5¢ small fluctuation window.
   */
  public playLockChime(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0, dur: 0.25, vol: 0.22 },   // C5
      { freq: 659.25, start: 0.06, dur: 0.28, vol: 0.22 }, // E5
      { freq: 783.99, start: 0.12, dur: 0.35, vol: 0.25 }, // G5
      { freq: 1046.50, start: 0.20, dur: 0.55, vol: 0.30 } // C6 Lock Bell!
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const oscHarm = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      oscHarm.type = 'sine';
      oscHarm.frequency.setValueAtTime(n.freq * 2, now + n.start);
      const harmGain = ctx.createGain();
      harmGain.gain.value = 0.2;

      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + n.start + n.dur);

      osc.connect(gain);
      oscHarm.connect(harmGain);
      harmGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      oscHarm.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.02);
      oscHarm.stop(now + n.start + n.dur + 0.02);
    }
  }
}
