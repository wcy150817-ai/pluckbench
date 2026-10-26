import { ToneWaveform } from '../data/instruments';

export class ReferenceToneGenerator {
  private ctx: AudioContext | null = null;
  private oscPrimary: OscillatorNode | null = null;
  private oscHarmonic2: OscillatorNode | null = null;
  private oscHarmonic3: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying = false;
  private currentFreq = 440;
  private currentVolume = 0.5;
  private currentWaveform: ToneWaveform = 'plucked';

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public startContinuous(
    frequency: number,
    waveform: ToneWaveform = 'plucked',
    volume: number = 0.5
  ): void {
    const ctx = this.ensureContext();
    this.stopContinuous();

    this.currentFreq = frequency;
    this.currentWaveform = waveform;
    this.currentVolume = volume;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.02, volume * 0.45), now + 0.06);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(8000, frequency * 7), now);

    const osc1 = ctx.createOscillator();
    osc1.frequency.setValueAtTime(frequency, now);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(frequency * 2, now);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.frequency.setValueAtTime(frequency * 3, now);

    if (waveform === 'sine') {
      osc1.type = 'sine';
      gain2.gain.setValueAtTime(0.03, now);
      gain3.gain.setValueAtTime(0.0, now);
    } else if (waveform === 'triangle') {
      osc1.type = 'triangle';
      gain2.gain.setValueAtTime(0.08, now);
      gain3.gain.setValueAtTime(0.02, now);
    } else if (waveform === 'organ') {
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc3.type = 'triangle';
      gain2.gain.setValueAtTime(0.35, now);
      gain3.gain.setValueAtTime(0.18, now);
    } else {
      // 'plucked' warm string-like harmonic sustain
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc3.type = 'sine';
      gain2.gain.setValueAtTime(0.28, now);
      gain3.gain.setValueAtTime(0.12, now);
    }

    osc1.connect(filter);
    osc2.connect(gain2);
    gain2.connect(filter);
    osc3.connect(gain3);
    gain3.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    this.oscPrimary = osc1;
    this.oscHarmonic2 = osc2;
    this.oscHarmonic3 = osc3;
    this.filterNode = filter;
    this.masterGain = masterGain;
    this.isPlaying = true;
  }

  public updateFrequency(frequency: number): void {
    this.currentFreq = frequency;
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.oscPrimary?.frequency.setTargetAtTime(frequency, now, 0.025);
    this.oscHarmonic2?.frequency.setTargetAtTime(frequency * 2, now, 0.025);
    this.oscHarmonic3?.frequency.setTargetAtTime(frequency * 3, now, 0.025);
    this.filterNode?.frequency.setTargetAtTime(Math.min(8000, frequency * 7), now, 0.03);
  }

  public updateVolume(volume: number): void {
    this.currentVolume = volume;
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(Math.max(0.001, volume * 0.45), now, 0.03);
  }

  public updateWaveform(waveform: ToneWaveform): void {
    if (this.currentWaveform === waveform) return;
    this.currentWaveform = waveform;
    if (this.isPlaying) {
      this.startContinuous(this.currentFreq, waveform, this.currentVolume);
    }
  }

  public stopContinuous(): void {
    if (!this.isPlaying || !this.ctx) {
      this.isPlaying = false;
      return;
    }
    const now = this.ctx.currentTime;
    try {
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      }
      const o1 = this.oscPrimary;
      const o2 = this.oscHarmonic2;
      const o3 = this.oscHarmonic3;
      setTimeout(() => {
        try {
          o1?.stop();
          o2?.stop();
          o3?.stop();
          o1?.disconnect();
          o2?.disconnect();
          o3?.disconnect();
        } catch {
          // ignore already stopped
        }
      }, 65);
    } catch {
      // ignore cleanup errors
    }
    this.oscPrimary = null;
    this.oscHarmonic2 = null;
    this.oscHarmonic3 = null;
    this.masterGain = null;
    this.isPlaying = false;
  }

  /**
   * Play a realistic decaying plucked string tone (great for quick ear check when tapping a string)
   */
  public triggerPluck(frequency: number, volume: number = 0.55): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const duration = 2.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.05, volume * 0.55), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(9000, frequency * 9), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(300, frequency * 2.2), now + duration * 0.85);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.22, now);
    g2.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.5);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Subtle crystalline lock chime when a string has been tuned accurately
   */
  public playLockChime(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.09); // G6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }
}
