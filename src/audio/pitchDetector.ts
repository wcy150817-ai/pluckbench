/**
 * Studio-Grade Multi-Phase Pitch & Envelope Detection Engine (v3 — Ultra-Stable Fluid Damping)
 *
 * Key Acoustic Technologies:
 * 1. Target-String Focused NSDF Window:
 *    - When a target string is selected (String-First workflow), restricts fundamental search
 *      to [targetHz * 0.72, targetHz * 1.38] (±5.5 semitones), completely eliminating wild
 *      needle swings caused by room noise or higher harmonics.
 * 2. Three-Stage Instrument Envelope Tracker (Attack -> Sustain -> Decay):
 *    - Ignores the initial ~130ms pluck transient ("pitch chirp") so the needle doesn't jerk right.
 *    - Heavily weights the stable Sustain body and holds the reading during Decay.
 * 3. Overdamped Cascaded Smoothing Filter (Zero Left-Right Oscillation):
 *    - Uses a 16-frame trimmed weighted median + heavy low-pass smoothing with micro-deadband.
 */

export type EnvelopePhase = 'idle' | 'attack' | 'sustain' | 'decay';

export interface PitchDetectionResult {
  frequency: number | null;
  rawFrequency: number | null;
  lockedMidi: number | null;
  clarity: number;
  rmsDb: number;
  rmsLinear: number;
  envelopePhase: EnvelopePhase;
  isSustainLocked: boolean;
  ambientNoiseDb: number;
  isNoisyEnvironment: boolean;
}

export class PitchProcessor {
  private freqWindow: { freq: number; weight: number }[] = [];
  private stage1Freq: number | null = null;
  private stage2Freq: number | null = null;
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
    noiseGateDb: number = -48,
    deepNoiseSuppression: boolean = false,
    minFreq: number = 27.5,
    maxFreq: number = 2200,
    expectedTargetHz: number | null = null
  ): PitchDetectionResult {
    const n = buffer.length;

    // 1. Compute RMS level, DC offset, and Zero-Crossing Rate
    let sumSquares = 0;
    let dcSum = 0;
    let zeroCrossings = 0;
    for (let i = 0; i < n; i++) {
      const s = buffer[i];
      sumSquares += s * s;
      dcSum += s;
      if (
        i > 0 &&
        ((buffer[i - 1] >= 0 && s < 0) || (buffer[i - 1] < 0 && s >= 0))
      ) {
        zeroCrossings++;
      }
    }
    const rmsLinear = Math.sqrt(sumSquares / n);
    const rmsDb = rmsLinear > 1e-6 ? 20 * Math.log10(rmsLinear) : -100;
    const zcr = zeroCrossings / n;

    const effectiveGateDb = deepNoiseSuppression
      ? Math.max(-44, noiseGateDb + 6)
      : noiseGateDb;

    // 2. Detect Pluck Attack Transient
    const isSuddenOnset =
      rmsDb > effectiveGateDb &&
      rmsLinear > this.prevRmsLinear * 1.7 &&
      rmsDb -
        (this.prevRmsLinear > 1e-6
          ? 20 * Math.log10(this.prevRmsLinear)
          : -100) >
        5.0;

    this.prevRmsLinear = rmsLinear * 0.55 + this.prevRmsLinear * 0.45;

    if (isSuddenOnset) {
      // Suppress initial 8 frames (~130ms) of pluck tension chirp
      this.attackFramesRemaining = 8;
      this.peakRmsDb = rmsDb;
      this.sustainFramesCount = 0;
    } else if (rmsDb > this.peakRmsDb) {
      this.peakRmsDb = rmsDb;
    }

    // 3. Constrain search range around expectedTargetHz when string is locked!
    let searchMinFreq = minFreq;
    let searchMaxFreq = maxFreq;
    if (expectedTargetHz && expectedTargetHz > 20) {
      searchMinFreq = Math.max(22, expectedTargetHz * 0.74); // ~ -520 cents
      searchMaxFreq = Math.min(2400, expectedTargetHz * 1.35); // ~ +520 cents
    }

    const dcOffset = dcSum / n;
    const analysisLen = Math.min(n, 2048);
    const minLag = Math.max(2, Math.floor(sampleRate / searchMaxFreq));
    const maxLag = Math.min(
      Math.floor(analysisLen * 0.68),
      Math.ceil(sampleRate / searchMinFreq)
    );

    let rawFrequency: number | null = null;
    let refinedClarity = 0;

    if (rmsDb >= effectiveGateDb - 2 && maxLag > minLag) {
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

        // Stricter clarity requirement so background noise never moves the needle
        const minClarity = deepNoiseSuppression ? 0.74 : 0.65;

        if (globalMaxVal >= minClarity && zcr < 0.28) {
          const threshold = 0.90 * globalMaxVal;
          const chosenPeak =
            peaks.find((p) => p.val >= threshold) || peaks[0];

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
          if (
            freq >= searchMinFreq &&
            freq <= searchMaxFreq &&
            Number.isFinite(freq)
          ) {
            rawFrequency = freq;
          }
        } else {
          refinedClarity = globalMaxVal;
        }
      }
    }

    // 4. Ambient Noise & Chatter Monitor
    if (rmsDb > -48 && (refinedClarity < 0.58 || zcr > 0.20)) {
      this.noiseFloorDb = this.noiseFloorDb * 0.92 + rmsDb * 0.08;
      this.noisyFrameScore = Math.min(100, this.noisyFrameScore + 4.5);
    } else if (rmsDb < -52) {
      this.noiseFloorDb = this.noiseFloorDb * 0.96 + rmsDb * 0.04;
      this.noisyFrameScore = Math.max(0, this.noisyFrameScore - 1.2);
    } else {
      this.noisyFrameScore = Math.max(0, this.noisyFrameScore - 0.8);
    }
    const isNoisyEnvironment =
      this.noisyFrameScore >= 26 || this.noiseFloorDb > -44;

    // 5. Handle No Valid Musical Pitch Detected
    if (rawFrequency === null || rmsDb < effectiveGateDb) {
      this.framesWithoutSignal++;

      // Hold the locked sustain pitch steady for ~45 frames (~0.75s) so the needle doesn't drop abruptly
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

      if (this.framesWithoutSignal > 24) {
        this.freqWindow = [];
        this.stage1Freq = null;
        this.stage2Freq = null;
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

    // 6. Determine Envelope Phase
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

    // 7. Hysteresis Note-Switch Filter
    const rawFloatMidi = 69 + 12 * Math.log2(rawFrequency / 440);
    const nearestMidi = Math.round(rawFloatMidi);

    if (this.lockedMidi === null) {
      this.lockedMidi = nearestMidi;
      this.candidateMidi = nearestMidi;
      this.candidateMidiCount = 1;
    } else if (nearestMidi !== this.lockedMidi) {
      const centsFromLocked = Math.abs((rawFloatMidi - this.lockedMidi) * 100);
      if (centsFromLocked > 72) {
        if (this.candidateMidi === nearestMidi) {
          this.candidateMidiCount++;
          if (this.candidateMidiCount >= 7) {
            this.lockedMidi = nearestMidi;
            this.freqWindow = [];
            this.sustainLockedFreq = null;
            this.stage1Freq = rawFrequency;
            this.stage2Freq = rawFrequency;
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

    // 8. Heavy Cascaded Fluid Smoothing (Eliminates Left-Right Oscillation)
    const phaseMultiplier =
      envelopePhase === 'attack' ? 0.08 : envelopePhase === 'sustain' ? 1.0 : 0.15;
    const snrFactor = Math.max(0.15, Math.min(1.0, (rmsDb + 60) / 45));
    const frameWeight =
      refinedClarity * refinedClarity * snrFactor * phaseMultiplier;

    if (this.stage2Freq !== null) {
      const jumpCents = Math.abs(1200 * Math.log2(rawFrequency / this.stage2Freq));
      if (jumpCents > 95 && this.candidateMidiCount < 6) {
        return {
          frequency: this.sustainLockedFreq ?? this.stage2Freq,
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
    if (this.freqWindow.length > 16) {
      this.freqWindow.shift();
    }

    const sortedByFreq = [...this.freqWindow].sort((a, b) => a.freq - b.freq);
    const medianFreq = sortedByFreq[Math.floor(sortedByFreq.length / 2)].freq;

    let weightedSum = 0;
    let weightTotal = 0;
    for (const item of this.freqWindow) {
      const diffCents = Math.abs(1200 * Math.log2(item.freq / medianFreq));
      if (diffCents <= 25) {
        weightedSum += item.freq * item.weight;
        weightTotal += item.weight;
      }
    }
    const targetFreq = weightTotal > 0 ? weightedSum / weightTotal : medianFreq;

    if (this.stage1Freq === null || this.stage2Freq === null) {
      this.stage1Freq = targetFreq;
      this.stage2Freq = targetFreq;
    } else {
      const deltaCents = Math.abs(
        1200 * Math.log2(targetFreq / this.stage2Freq)
      );
      // Deadband within ±1.5 cents: keep ultra-calm!
      const alpha1 =
        envelopePhase === 'attack'
          ? 0.04
          : deltaCents < 2.0
          ? 0.035
          : deltaCents < 10
          ? 0.09
          : 0.16;
      const alpha2 = 0.12;

      this.stage1Freq = this.stage1Freq + alpha1 * (targetFreq - this.stage1Freq);
      this.stage2Freq = this.stage2Freq + alpha2 * (this.stage1Freq - this.stage2Freq);
    }

    if (envelopePhase === 'sustain' && this.sustainFramesCount >= 3) {
      if (this.sustainLockedFreq === null) {
        this.sustainLockedFreq = this.stage2Freq;
      } else {
        this.sustainLockedFreq =
          this.sustainLockedFreq * 0.88 + this.stage2Freq * 0.12;
      }
      this.decayHoldFrames = 42;
    }

    const finalOutputFreq = this.sustainLockedFreq ?? this.stage2Freq;

    return {
      frequency: finalOutputFreq,
      rawFrequency,
      lockedMidi: this.lockedMidi,
      clarity: refinedClarity,
      rmsDb,
      rmsLinear,
      envelopePhase,
      isSustainLocked:
        this.sustainLockedFreq !== null && this.sustainFramesCount >= 3,
      ambientNoiseDb: this.noiseFloorDb,
      isNoisyEnvironment,
    };
  }

  public reset(): void {
    this.freqWindow = [];
    this.stage1Freq = null;
    this.stage2Freq = null;
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
