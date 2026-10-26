/**
 * Studio-grade Pitch Detection Engine using Normalized Square Difference Function (NSDF / McLeod Pitch Method)
 * with Parabolic Peak Interpolation and Median + Adaptive EMA filtering.
 *
 * Designed specifically for musical instruments (27.5 Hz A0 up to 2637 Hz E7)
 * to avoid harmonic octave-jumping on guitar, bass, violin, guzheng, and erhu.
 */

export interface PitchDetectionResult {
  frequency: number | null; // Smoothed detected fundamental frequency in Hz
  rawFrequency: number | null;
  clarity: number;          // Confidence [0.0 - 1.0]
  rmsDb: number;            // Signal level in dBFS (-100 to 0)
  rmsLinear: number;        // Linear RMS [0.0 - 1.0]
}

export class PitchProcessor {
  private history: number[] = [];
  private smoothedFreq: number | null = null;
  private framesWithoutSignal = 0;

  /**
   * Analyze a time-domain float32 buffer from Web Audio AnalyserNode
   */
  public detect(
    buffer: Float32Array,
    sampleRate: number,
    noiseGateDb: number = -52,
    minFreq: number = 27.5,
    maxFreq: number = 2200
  ): PitchDetectionResult {
    const n = buffer.length;

    // 1. Compute RMS level and DC offset
    let sumSquares = 0;
    let dcSum = 0;
    for (let i = 0; i < n; i++) {
      const s = buffer[i];
      sumSquares += s * s;
      dcSum += s;
    }
    const rmsLinear = Math.sqrt(sumSquares / n);
    const rmsDb = rmsLinear > 1e-6 ? 20 * Math.log10(rmsLinear) : -100;

    // Noise gate check
    if (rmsDb < noiseGateDb) {
      this.framesWithoutSignal++;
      if (this.framesWithoutSignal > 8) {
        this.history = [];
        this.smoothedFreq = null;
      }
      return {
        frequency: null,
        rawFrequency: null,
        clarity: 0,
        rmsDb,
        rmsLinear,
      };
    }

    const dcOffset = dcSum / n;

    // Use analysis window up to 2048 samples for responsive real-time performance
    const analysisLen = Math.min(n, 2048);
    const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));
    const maxLag = Math.min(Math.floor(analysisLen * 0.65), Math.ceil(sampleRate / minFreq));

    // 2. Compute NSDF(tau) = 2 * r(tau) / m(tau)
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

    // 3. Find positive-region peak maxima in NSDF
    // Following McLeod Pitch Method: collect highest peak between each positive zero-crossing and negative zero-crossing
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

    if (peaks.length === 0) {
      return {
        frequency: this.smoothedFreq,
        rawFrequency: null,
        clarity: 0,
        rmsDb,
        rmsLinear,
      };
    }

    // Find global peak value among all positive regions
    let globalMaxVal = 0;
    for (const p of peaks) {
      if (p.val > globalMaxVal) globalMaxVal = p.val;
    }

    // Clarity threshold
    if (globalMaxVal < 0.52) {
      return {
        frequency: null,
        rawFrequency: null,
        clarity: globalMaxVal,
        rmsDb,
        rmsLinear,
      };
    }

    // Pick first peak above k * globalMaxVal (k = 0.88 prevents octave errors on rich harmonics)
    const threshold = 0.88 * globalMaxVal;
    const chosenPeak = peaks.find((p) => p.val >= threshold) || peaks[0];

    // 4. Parabolic interpolation around chosenPeak.tau for sub-sample precision
    const tau = chosenPeak.tau;
    const y1 = nsdf[tau - 1];
    const y2 = nsdf[tau];
    const y3 = nsdf[tau + 1];

    const denom = 2 * y2 - y1 - y3;
    let refinedTau = tau;
    let refinedClarity = y2;
    if (Math.abs(denom) > 1e-9) {
      const delta = (y3 - y1) / (2 * denom);
      if (Math.abs(delta) < 1) {
        refinedTau = tau + delta;
        refinedClarity = Math.min(1, y2 + 0.25 * (y3 - y1) * delta);
      }
    }

    const rawFrequency = sampleRate / refinedTau;
    if (rawFrequency < minFreq || rawFrequency > maxFreq || !Number.isFinite(rawFrequency)) {
      return {
        frequency: null,
        rawFrequency: null,
        clarity: 0,
        rmsDb,
        rmsLinear,
      };
    }

    this.framesWithoutSignal = 0;

    // 5. Median + Adaptive Exponential Smoothing
    this.history.push(rawFrequency);
    if (this.history.length > 5) {
      this.history.shift();
    }

    const sorted = [...this.history].sort((a, b) => a - b);
    const medianFreq = sorted[Math.floor(sorted.length / 2)];

    if (this.smoothedFreq === null) {
      this.smoothedFreq = medianFreq;
    } else {
      // Check semitone jump: if user plucked a completely different string (> 80 cents away), snap faster
      const centsDiff = Math.abs(1200 * Math.log2(medianFreq / this.smoothedFreq));
      if (centsDiff > 90) {
        this.smoothedFreq = medianFreq;
        this.history = [rawFrequency];
      } else {
        // Smooth tracking inside the same note
        const alpha = centsDiff > 20 ? 0.42 : 0.26;
        this.smoothedFreq = this.smoothedFreq + alpha * (medianFreq - this.smoothedFreq);
      }
    }

    return {
      frequency: this.smoothedFreq,
      rawFrequency,
      clarity: refinedClarity,
      rmsDb,
      rmsLinear,
    };
  }

  public reset(): void {
    this.history = [];
    this.smoothedFreq = null;
    this.framesWithoutSignal = 0;
  }
}
