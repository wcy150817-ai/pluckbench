/**
 * Studio-Grade Multi-Phase Pitch & Envelope Detection Engine
 *
 * Key Acoustic Technologies:
 * 1. McLeod Pitch Method (NSDF) + Parabolic Interpolation for fundamental extraction without harmonic octave-jumping.
 * 2. Three-Stage Instrument Envelope Tracker (Attack -> Sustain -> Decay):
 *    - Rejects initial pluck transient "pitch chirp" (0-130ms sharp spike on Guitar/Guzheng/Ukulele/Pipa).
 *    - Locks onto the golden "Sustain Body" phase using clarity*energy weighted averaging.
 *    - Holds the locked sustain pitch during the weak Decay tail so the needle stays rock-steady.
 * 3. Hysteresis Note-Switch Filter & Micro-Jitter Deadband:
 *    - Prevents erratic jumping between notes or twitching on vibrato (Violin/Erhu/Voice).
 * 4. Smart Ambient Noise & Chatter Monitor:
 *    - Detects non-harmonic environmental noise (speech, fan, street noise) and alerts the user to enable Deep Noise Suppression.
 */

export type EnvelopePhase = 'idle' | 'attack' | 'sustain' | 'decay';

export interface PitchDetectionResult {
  frequency: number | null;       // Stabilized sustain-weighted fundamental frequency in Hz
  rawFrequency: number | null;    // Instantaneous raw frequency
  lockedMidi: number | null;      // Hysteresis-stabilized integer MIDI note
  clarity: number;                // Harmonic periodicity confidence [0.0 - 1.0]
  rmsDb: number;                  // Current signal level in dBFS (-100 to 0)
  rmsLinear: number;              // Linear RMS [0.0 - 1.0]
  envelopePhase: EnvelopePhase;   // Current acoustic phase of the instrument note
  isSustainLocked: boolean;       // True when locked onto stable sustain body
  ambientNoiseDb: number;         // Estimated background noise floor in dB
  isNoisyEnvironment: boolean;    // True when ambient non-harmonic noise is high
}

export class PitchProcessor {
  private freqWindow: { freq: number; weight: number }[] = [];
  private smoothedFreq: number | null = null;
  private sustainLockedFreq: number | null = null;
  private lockedMidi: number | null = null;
  private candidateMidi: number | null = null;
  private candidateMidiCount = 0;

  // Envelope tracking
  private prevRmsLinear = 0;
  private peakRmsDb = -100;
  private attackFramesRemaining = 0;
  private sustainFramesCount = 0;
  private decayHoldFrames = 0;
  private framesWithoutSignal = 0;

  // Ambient noise floor & chatter monitoring
  private noiseFloorDb = -65;
  private noisyFrameScore = 0;

  public detect(
    buffer: Float32Array,
    sampleRate: number,
    noiseGateDb: number = -50,
    deepNoiseSuppression: boolean = false,
    minFreq: number = 27.5,
    maxFreq: number = 2200
  ): PitchDetectionResult {
    const n = buffer.length;

    // 1. Compute RMS level, DC offset, and Zero-Crossing Rate (to distinguish speech/hiss from musical notes)
    let sumSquares = 0;
    let dcSum = 0;
    let zeroCrossings = 0;
    for (let i = 0; i < n; i++) {
      const s = buffer[i];
      sumSquares += s * s;
      dcSum += s;
      if (i > 0 && ((buffer[i - 1] >= 0 && s < 0) || (buffer[i - 1] < 0 && s >= 0))) {
        zeroCrossings++;
      }
    }
    const rmsLinear = Math.sqrt(sumSquares / n);
    const rmsDb = rmsLinear > 1e-6 ? 20 * Math.log10(rmsLinear) : -100;
    const zcr = zeroCrossings / n;

    // Effective noise gate (stricter when Deep Noise Suppression is active)
    const effectiveGateDb = deepNoiseSuppression ? Math.max(-46, noiseGateDb + 6) : noiseGateDb;

    // 2. Detect Pluck Attack Transient (sudden amplitude jump >= +4.5 dB / 1.65x linear RMS)
    const isSuddenOnset =
      rmsDb > effectiveGateDb &&
      rmsLinear > this.prevRmsLinear * 1.65 &&
      rmsDb - (this.prevRmsLinear > 1e-6 ? 20 * Math.log10(this.prevRmsLinear) : -100) > 4.5;

    this.prevRmsLinear = rmsLinear * 0.6 + this.prevRmsLinear * 0.4;

    if (isSuddenOnset) {
      // Enter Attack Phase for ~7 frames (~115ms) to reject initial pluck tension chirp
      this.attackFramesRemaining = 7;
      this.peakRmsDb = rmsDb;
      this.sustainFramesCount = 0;
    } else if (rmsDb > this.peakRmsDb) {
      this.peakRmsDb = rmsDb;
    }

    // 3. Compute NSDF (Normalized Square Difference Function) when above minimum energy
    const dcOffset = dcSum / n;
    const analysisLen = Math.min(n, 2048);
    const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));
    const maxLag = Math.min(Math.floor(analysisLen * 0.65), Math.ceil(sampleRate / minFreq));

    let rawFrequency: number | null = null;
    let refinedClarity = 0;

    if (rmsDb >= effectiveGateDb - 4) {
      const nsdf = new Float32Array(maxLag + 1);
      for (let tau = minLag; tau <= maxLag; tau++) {
        let acf = 0;
        let divisorM = 0;
        const limit = analysisLen - tau;
        for (let i = 0; i < limit; i++) {
          const x0 = buffer[i] - dcOffset;
          const xTau = buffer[i + tau] - dcOffset;
          acf += x0 * xTau;
          divisorM += x0 * x0 + xTau * xTau;
        }
        nsdf[tau] = divisorM > 1e-12 ? (2 * acf) / divisorM : 0;
      }

      // Collect positive-region peak maxima
      const peaks: { tau: number; val: number }[] = [];
      let inPositiveRegion = false;
      let currentMaxTau = 0;
      let currentMaxVal = -Infinity;

      for (let tau = minLag; tau <= maxLag; tau++) {
        const val = nsdf[tau];
        if (val > 0) {
          if (!inPositiveRegion) {
            inPositiveRegion = true;
            currentMaxTau = tau;
            currentMaxVal = val;
          } else if (val > currentMaxVal) {
            currentMaxVal = val;
            currentMaxTau = tau;
          }
        } else if (inPositiveRegion) {
          if (currentMaxTau > minLag && currentMaxTau < maxLag) {
            peaks.push({ tau: currentMaxTau, val: currentMaxVal });
          }
          inPositiveRegion = false;
        }
      }
      if (inPositiveRegion && currentMaxTau > minLag && currentMaxTau < maxLag) {
        peaks.push({ tau: currentMaxTau, val: currentMaxVal });
      }

      if (peaks.length > 0) {
        let globalMaxVal = 0;
        for (const p of peaks) {
          if (p.val > globalMaxVal) globalMaxVal = p.val;
        }

        // Clarity threshold: require higher periodicity in noisy environments to reject speech/clatter
        const minClarity = deepNoiseSuppression ? 0.72 : 0.60;

        if (globalMaxVal >= minClarity && zcr < 0.32) {
          // k = 0.89 selects fundamental over strong 2nd/3rd harmonics
          const threshold = 0.89 * globalMaxVal;
          const chosenPeak = peaks.find((p) => p.val >= threshold) || peaks[0];

          const tau = chosenPeak.tau;
          const y1 = nsdf[tau - 1];
          const y2 = nsdf[tau];
          const y3 = nsdf[tau + 1];
          const denom = 2 * y2 - y1 - y3;
          let refinedTau = tau;
          refinedClarity = y2;
          if (Math.abs(denom) > 1e-9) {
            const delta = (y3 - y1) / (2 * denom);
            if (Math.abs(delta) < 1) {
              refinedTau = tau + delta;
              refinedClarity = Math.min(1, y2 + 0.25 * (y3 - y1) * delta);
            }
          }

          const freq = sampleRate / refinedTau;
          if (freq >= minFreq && freq <= maxFreq && Number.isFinite(freq)) {
            rawFrequency = freq;
          }
        } else {
          refinedClarity = globalMaxVal;
        }
      }
    }

    // 4. Update Ambient Noise & Chatter Monitor
    // If energy is moderately loud (>-48dB) but clarity is low (<0.56) or ZCR is high (speech/fan/clatter), increment noisy score
    if (rmsDb > -48 && (refinedClarity < 0.56 || zcr > 0.22)) {
      this.noiseFloorDb = this.noiseFloorDb * 0.92 + rmsDb * 0.08;
      this.noisyFrameScore = Math.min(100, this.noisyFrameScore + 4.5);
    } else if (rmsDb < -52) {
      this.noiseFloorDb = this.noiseFloorDb * 0.96 + rmsDb * 0.04;
      this.noisyFrameScore = Math.max(0, this.noisyFrameScore - 1.2);
    } else {
      this.noisyFrameScore = Math.max(0, this.noisyFrameScore - 0.8);
    }
    const isNoisyEnvironment = this.noisyFrameScore >= 28 || this.noiseFloorDb > -44;

    // 5. Handle No Valid Musical Pitch Detected
    if (rawFrequency === null || rmsDb < effectiveGateDb) {
      this.framesWithoutSignal++;

      // If we had a solid Sustain Lock just before the string decayed, hold the display for ~35 frames (~0.6s)
      if (this.sustainLockedFreq !== null && this.decayHoldFrames > 0) {
        this.decayHoldFrames--;
        return {
          frequency: this.sustainLockedFreq,
          rawFrequency: null,
          lockedMidi: this.lockedMidi,
          clarity: refinedClarity,
          rmsDb,
          rmsLinear,
          envelopePhase: 'decay',
          isSustainLocked: true,
          ambientNoiseDb: this.noiseFloorDb,
          isNoisyEnvironment,
        };
      }

      if (this.framesWithoutSignal > 18) {
        this.freqWindow = [];
        this.smoothedFreq = null;
        this.sustainLockedFreq = null;
        this.sustainFramesCount = 0;
        this.peakRmsDb = -100;
      }

      return {
        frequency: null,
        rawFrequency: null,
        lockedMidi: this.lockedMidi,
        clarity: refinedClarity,
        rmsDb,
        rmsLinear,
        envelopePhase: 'idle',
        isSustainLocked: false,
        ambientNoiseDb: this.noiseFloorDb,
        isNoisyEnvironment,
      };
    }

    this.framesWithoutSignal = 0;

    // 6. Determine Envelope Phase: Attack vs Sustain vs Decay
    let envelopePhase: EnvelopePhase = 'sustain';
    if (this.attackFramesRemaining > 0) {
      this.attackFramesRemaining--;
      envelopePhase = 'attack';
    } else if (this.peakRmsDb - rmsDb > 13 && this.sustainFramesCount > 6) {
      envelopePhase = 'decay';
    } else {
      envelopePhase = 'sustain';
      this.sustainFramesCount++;
    }

    // 7. Hysteresis Note-Switch Filter (prevents erratic jumping between semitones)
    const rawFloatMidi = 69 + 12 * Math.log2(rawFrequency / 440);
    const nearestMidi = Math.round(rawFloatMidi);

    if (this.lockedMidi === null) {
      this.lockedMidi = nearestMidi;
      this.candidateMidi = nearestMidi;
      this.candidateMidiCount = 1;
    } else if (nearestMidi !== this.lockedMidi) {
      // Check how far in cents rawFloatMidi is from current lockedMidi
      const centsFromLocked = Math.abs((rawFloatMidi - this.lockedMidi) * 100);
      // Require > 68 cents away AND at least 5 consecutive frames on the new note before switching!
      if (centsFromLocked > 68) {
        if (this.candidateMidi === nearestMidi) {
          this.candidateMidiCount++;
          if (this.candidateMidiCount >= 5) {
            this.lockedMidi = nearestMidi;
            this.freqWindow = [];
            this.sustainLockedFreq = null;
            this.smoothedFreq = rawFrequency;
          }
        } else {
          this.candidateMidi = nearestMidi;
          this.candidateMidiCount = 1;
        }
      }
    } else {
      this.candidateMidi = nearestMidi;
      this.candidateMidiCount = 0;
    }

    // 8. Sustain-Phase Weighted Pitch Stabilizer
    // During 'attack', give very low weight (0.15) to reject pluck tension spike.
    // During 'sustain', give high weight proportional to clarity^2 * SNR.
    // During 'decay', give low weight so fading tail drift doesn't pull the reading off!
    const phaseMultiplier =
      envelopePhase === 'attack' ? 0.12 : envelopePhase === 'sustain' ? 1.0 : 0.2;
    const snrFactor = Math.max(0.1, Math.min(1.0, (rmsDb + 60) / 45));
    const frameWeight = refinedClarity * refinedClarity * snrFactor * phaseMultiplier;

    // Reject wild single-frame harmonic glitches (>120 cents away from current window median)
    if (this.smoothedFreq !== null) {
      const jumpCents = Math.abs(1200 * Math.log2(rawFrequency / this.smoothedFreq));
      if (jumpCents > 120 && this.candidateMidiCount < 4) {
        // Ignore single-frame harmonic glitch
        return {
          frequency: this.sustainLockedFreq ?? this.smoothedFreq,
          rawFrequency,
          lockedMidi: this.lockedMidi,
          clarity: refinedClarity,
          rmsDb,
          rmsLinear,
          envelopePhase,
          isSustainLocked: this.sustainLockedFreq !== null,
          ambientNoiseDb: this.noiseFloorDb,
          isNoisyEnvironment,
        };
      }
    }

    this.freqWindow.push({ freq: rawFrequency, weight: frameWeight });
    if (this.freqWindow.length > 12) {
      this.freqWindow.shift();
    }

    // Compute weighted average around median of window
    const sortedByFreq = [...this.freqWindow].sort((a, b) => a.freq - b.freq);
    const medianFreq = sortedByFreq[Math.floor(sortedByFreq.length / 2)].freq;

    let weightedSum = 0;
    let weightTotal = 0;
    for (const item of this.freqWindow) {
      const diffCents = Math.abs(1200 * Math.log2(item.freq / medianFreq));
      if (diffCents <= 35) {
        weightedSum += item.freq * item.weight;
        weightTotal += item.weight;
      }
    }
    const targetFreq = weightTotal > 0 ? weightedSum / weightTotal : medianFreq;

    if (this.smoothedFreq === null) {
      this.smoothedFreq = targetFreq;
    } else {
      // Smooth EMA with micro-deadband: if change is < 0.8 cents, apply ultra-gentle damping so readout doesn't flicker
      const deltaCents = Math.abs(1200 * Math.log2(targetFreq / this.smoothedFreq));
      const alpha =
        envelopePhase === 'attack'
          ? 0.08
          : deltaCents < 1.2
          ? 0.06
          : deltaCents < 8
          ? 0.16
          : 0.28;
      this.smoothedFreq = this.smoothedFreq + alpha * (targetFreq - this.smoothedFreq);
    }

    // Lock sustain pitch when we have >= 5 stable frames in sustain phase
    if (envelopePhase === 'sustain' && this.sustainFramesCount >= 4) {
      if (this.sustainLockedFreq === null) {
        this.sustainLockedFreq = this.smoothedFreq;
      } else {
        this.sustainLockedFreq =
          this.sustainLockedFreq * 0.82 + this.smoothedFreq * 0.18;
      }
      this.decayHoldFrames = 32; // Hold for ~0.55s after string fades
    }

    const finalOutputFreq = this.sustainLockedFreq ?? this.smoothedFreq;

    return {
      frequency: finalOutputFreq,
      rawFrequency,
      lockedMidi: this.lockedMidi,
      clarity: refinedClarity,
      rmsDb,
      rmsLinear,
      envelopePhase,
      isSustainLocked: this.sustainLockedFreq !== null && this.sustainFramesCount >= 4,
      ambientNoiseDb: this.noiseFloorDb,
      isNoisyEnvironment,
    };
  }

  public reset(): void {
    this.freqWindow = [];
    this.smoothedFreq = null;
    this.sustainLockedFreq = null;
    this.lockedMidi = null;
    this.candidateMidi = null;
    this.candidateMidiCount = 0;
    this.attackFramesRemaining = 0;
    this.sustainFramesCount = 0;
    this.decayHoldFrames = 0;
    this.framesWithoutSignal = 0;
  }
}
