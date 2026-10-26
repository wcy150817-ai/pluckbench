import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  INSTRUMENT_PRESETS,
  TIMBRE_OPTIONS,
  InstrumentPreset,
  TuningVariant,
  StringSpec,
  TemperamentId,
  NotationStyle,
  TunerMode,
  ToneWaveform,
  getNoteInfo,
  getCentsOffset,
  frequencyToFloatMidi,
  midiToFrequency,
} from './data/instruments';
import { PitchProcessor, EnvelopePhase } from './audio/pitchDetector';
import { ReferenceToneGenerator } from './audio/toneGenerator';
import { GStringsDialMeter } from './components/GStringsDialMeter';
import { ScrollingNoteTape } from './components/ScrollingNoteTape';
import { InstrumentStringsPanel } from './components/InstrumentStringsPanel';
import { SettingsModal } from './components/SettingsModal';
import { MetronomeTool } from './components/MetronomeTool';
import { ChordLibraryTool } from './components/ChordLibraryTool';
import { EarTrainerTool } from './components/EarTrainerTool';
import { DecibelMeterTool } from './components/DecibelMeterTool';
import { SeoKnowledgeFooter } from './components/SeoKnowledgeFooter';
import {
  Mic,
  MicOff,
  Sliders,
  Volume2,
  VolumeX,
  Crosshair,
  Wand2,
  Radio,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Timer,
  Guitar,
  Headphones,
  BarChart3,
} from 'lucide-react';

type ActiveToolTab = 'tuner' | 'metronome' | 'chords' | 'ear-trainer' | 'decibel';

export const App: React.FC = () => {
  // Multi-Tool Navigation State
  const [activeTool, setActiveTool] = useState<ActiveToolTab>('tuner');

  // Instrument & Tuning State
  const [selectedPreset, setSelectedPreset] = useState<InstrumentPreset>(
    INSTRUMENT_PRESETS[1] // Guitar Standard
  );
  const [selectedTuning, setSelectedTuning] = useState<TuningVariant>(
    INSTRUMENT_PRESETS[1].tunings[0]
  );

  // Core Mode: 'tune-auto' | 'tune-manual' | 'sound-it'
  const [tunerMode, setTunerMode] = useState<TunerMode>('tune-auto');
  const [snapToStringsOnly, setSnapToStringsOnly] = useState<boolean>(true);

  // Calibration, Timbre & Noise Reduction Settings
  const [a4Hz, setA4Hz] = useState<number>(440);
  const [temperament, setTemperament] = useState<TemperamentId>('equal');
  const [notationStyle, setNotationStyle] = useState<NotationStyle>('letter');
  const [dampingMode, setDampingMode] = useState<'fast' | 'balanced' | 'smooth'>('balanced');
  const [noiseGateDb, setNoiseGateDb] = useState<number>(-50);
  const [deepNoiseSuppression, setDeepNoiseSuppression] = useState<boolean>(false);
  const [waveform, setWaveform] = useState<ToneWaveform>('auto-instrument');
  const [toneVolume, setToneVolume] = useState<number>(0.65);
  const [showPitchTrail, setShowPitchTrail] = useState<boolean>(true);
  const [enableLockChime, setEnableLockChime] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Target & Stabilized Pitch State
  const [targetMidi, setTargetMidi] = useState<number>(40); // Default Guitar 6th string E2 or A4
  const [measuredFreq, setMeasuredFreq] = useState<number | null>(null);
  const [currentFloatMidi, setCurrentFloatMidi] = useState<number>(40);
  const [centsOffset, setCentsOffset] = useState<number>(0);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [clarity, setClarity] = useState<number>(0);
  const [rmsDb, setRmsDb] = useState<number>(-100);
  const [envelopePhase, setEnvelopePhase] = useState<EnvelopePhase>('idle');
  const [isSustainLocked, setIsSustainLocked] = useState<boolean>(false);
  const [isNoisyEnvironment, setIsNoisyEnvironment] = useState<boolean>(false);
  const [noiseAlertDismissed, setNoiseAlertDismissed] = useState<boolean>(false);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());

  // Microphone & Simulation State
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Audio & DSP Filter Chain Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafLoopRef = useRef<number | null>(null);
  const pitchProcessorRef = useRef<PitchProcessor>(new PitchProcessor());
  const toneGenRef = useRef<ReferenceToneGenerator>(new ReferenceToneGenerator());
  const inTuneTimerRef = useRef<{ midi: number; frames: number }>({ midi: -1, frames: 0 });

  // Resolve authentic acoustic instrument timbre
  const resolvedTimbre = useMemo(() => {
    if (waveform !== 'auto-instrument') return waveform;
    return selectedTuning.defaultTimbre || selectedPreset.defaultTimbre || 'acoustic-guitar';
  }, [waveform, selectedTuning, selectedPreset]);

  const activeTimbreLabel = useMemo(() => {
    const found = TIMBRE_OPTIONS.find((t) => t.id === resolvedTimbre);
    return found ? found.name.split(' ')[0] : '原声建模';
  }, [resolvedTimbre]);

  // Keep latest state in refs for inside requestAnimationFrame loop
  const stateRef = useRef({
    tunerMode,
    snapToStringsOnly,
    selectedPreset,
    selectedTuning,
    targetMidi,
    a4Hz,
    temperament,
    noiseGateDb,
    deepNoiseSuppression,
    enableLockChime,
  });

  useEffect(() => {
    stateRef.current = {
      tunerMode,
      snapToStringsOnly,
      selectedPreset,
      selectedTuning,
      targetMidi,
      a4Hz,
      temperament,
      noiseGateDb,
      deepNoiseSuppression,
      enableLockChime,
    };

    // Dynamically adjust hardware bandpass filter cutoffs when instrument or noise mode changes
    if (highPassFilterRef.current && lowPassFilterRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (deepNoiseSuppression) {
        if (tunerMode === 'tune-manual') {
          // Narrow bandpass around locked target string (±35%)
          const targetHz = midiToFrequency(targetMidi, a4Hz, temperament);
          highPassFilterRef.current.frequency.setTargetAtTime(Math.max(25, targetHz * 0.68), now, 0.04);
          lowPassFilterRef.current.frequency.setTargetAtTime(Math.min(2500, targetHz * 1.45), now, 0.04);
        } else {
          // Bandpass tailored to current instrument's fundamental range
          highPassFilterRef.current.frequency.setTargetAtTime(
            Math.max(25, selectedPreset.minFreqHz * 0.78),
            now,
            0.04
          );
          lowPassFilterRef.current.frequency.setTargetAtTime(
            Math.min(2500, selectedPreset.maxFreqHz * 1.25),
            now,
            0.04
          );
        }
      } else {
        // Standard broad musical range
        highPassFilterRef.current.frequency.setTargetAtTime(26, now, 0.04);
        lowPassFilterRef.current.frequency.setTargetAtTime(2200, now, 0.04);
      }
    }
  }, [
    tunerMode,
    snapToStringsOnly,
    selectedPreset,
    selectedTuning,
    targetMidi,
    a4Hz,
    temperament,
    noiseGateDb,
    deepNoiseSuppression,
    enableLockChime,
  ]);

  const instrumentMidis = useMemo(() => {
    return new Set(selectedTuning.strings.map((s) => s.midi));
  }, [selectedTuning]);

  const matchedString = useMemo(() => {
    return selectedTuning.strings.find((s) => s.midi === targetMidi) || null;
  }, [selectedTuning, targetMidi]);

  const targetNote = useMemo(() => {
    return getNoteInfo(targetMidi, a4Hz, temperament);
  }, [targetMidi, a4Hz, temperament]);

  // Process stabilized pitch from PitchProcessor
  const processDetectedPitch = useCallback(
    (
      freq: number | null,
      lockedMidiFromDetector: number | null,
      conf: number,
      db: number,
      phase: EnvelopePhase,
      sustainLocked: boolean,
      noisyEnv: boolean
    ) => {
      const st = stateRef.current;
      setRmsDb(db);
      setClarity(conf);
      setEnvelopePhase(phase);
      setIsSustainLocked(sustainLocked);
      setIsNoisyEnvironment(noisyEnv);

      if (!freq || freq <= 0) {
        setHasSignal(false);
        setMeasuredFreq(null);
        inTuneTimerRef.current.frames = 0;
        return;
      }

      setHasSignal(true);
      setMeasuredFreq(freq);

      const floatMidi = frequencyToFloatMidi(freq, st.a4Hz);
      setCurrentFloatMidi(floatMidi);

      let chosenMidi = st.targetMidi;

      if (st.tunerMode === 'tune-auto') {
        if (
          st.selectedPreset.id !== 'chromatic' &&
          st.snapToStringsOnly &&
          st.selectedTuning.strings.length > 0
        ) {
          // Hysteresis string matching: prefer staying on current string unless new string is > 25 cents closer
          let bestString = st.selectedTuning.strings[0];
          let minDiff = Infinity;
          let currentStringDiff = Infinity;

          for (const str of st.selectedTuning.strings) {
            const strFreq = midiToFrequency(str.midi, st.a4Hz, st.temperament);
            const diffCents = Math.abs(getCentsOffset(freq, strFreq));
            if (str.midi === st.targetMidi) {
              currentStringDiff = diffCents;
            }
            if (diffCents < minDiff) {
              minDiff = diffCents;
              bestString = str;
            }
          }

          if (currentStringDiff <= minDiff + 24) {
            chosenMidi = st.targetMidi;
          } else {
            chosenMidi = bestString.midi;
          }
        } else {
          // Use hysteresis-stabilized MIDI from detector
          chosenMidi =
            lockedMidiFromDetector ?? Math.max(21, Math.min(108, Math.round(floatMidi)));
        }
        setTargetMidi(chosenMidi);
      }

      const targetHz = midiToFrequency(chosenMidi, st.a4Hz, st.temperament);
      const rawCents = getCentsOffset(freq, targetHz);
      const clampedCents = Math.max(-50, Math.min(50, rawCents));
      setCentsOffset(clampedCents);

      // Check if string stays locked in tune during sustain phase (|cents| <= 3.0)
      if (Math.abs(rawCents) <= 3.0 && phase !== 'attack') {
        if (inTuneTimerRef.current.midi === chosenMidi) {
          inTuneTimerRef.current.frames += 1;
          if (inTuneTimerRef.current.frames === 28) {
            setTunedStrings((prev) => {
              if (prev.has(chosenMidi)) return prev;
              const next = new Set(prev);
              next.add(chosenMidi);
              if (st.enableLockChime) {
                toneGenRef.current.playLockChime();
              }
              return next;
            });
          }
        } else {
          inTuneTimerRef.current = { midi: chosenMidi, frames: 1 };
        }
      } else {
        inTuneTimerRef.current.frames = Math.max(0, inTuneTimerRef.current.frames - 1);
      }
    },
    []
  );

  // Stop Microphone
  const stopMicrophone = useCallback(() => {
    if (rafLoopRef.current) {
      cancelAnimationFrame(rafLoopRef.current);
      rafLoopRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    highPassFilterRef.current = null;
    lowPassFilterRef.current = null;
    pitchProcessorRef.current.reset();
    setIsMicListening(false);
    setHasSignal(false);
    setMeasuredFreq(null);
    setRmsDb(-100);
    setEnvelopePhase('idle');
    setIsSustainLocked(false);
  }, []);

  // Start Microphone Listening with Multi-Stage Hardware Bandpass Noise Filter Chain
  const startMicrophone = useCallback(async () => {
    setMicError(null);
    setIsSimulating(false);
    toneGenRef.current.stopContinuous();
    if (tunerMode === 'sound-it') {
      setTunerMode('tune-auto');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          channelCount: 1,
        },
      });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);

      // Stage 1: 50Hz/60Hz AC Power Hum Notch Filter
      const humNotch = audioCtx.createBiquadFilter();
      humNotch.type = 'notch';
      humNotch.frequency.value = 50;
      humNotch.Q.value = 10;

      // Stage 2: High-Pass Filter (cuts low rumble, footsteps, wind)
      const highPass = audioCtx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.Q.value = 0.707;
      highPass.frequency.value = stateRef.current.deepNoiseSuppression
        ? Math.max(25, stateRef.current.selectedPreset.minFreqHz * 0.78)
        : 26;

      // Stage 3: Low-Pass Filter (cuts high-frequency hiss, sibilance, chatter)
      const lowPass = audioCtx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.Q.value = 0.707;
      lowPass.frequency.value = stateRef.current.deepNoiseSuppression
        ? Math.min(2500, stateRef.current.selectedPreset.maxFreqHz * 1.25)
        : 2200;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;

      source.connect(humNotch);
      humNotch.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      highPassFilterRef.current = highPass;
      lowPassFilterRef.current = lowPass;
      mediaStreamRef.current = stream;
      pitchProcessorRef.current.reset();
      setIsMicListening(true);

      const buffer = new Float32Array(analyser.fftSize);
      const analyzeLoop = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const st = stateRef.current;
        const result = pitchProcessorRef.current.detect(
          buffer,
          audioCtxRef.current.sampleRate,
          st.noiseGateDb,
          st.deepNoiseSuppression,
          st.deepNoiseSuppression ? Math.max(25, st.selectedPreset.minFreqHz * 0.72) : 27.5,
          st.deepNoiseSuppression ? Math.min(2200, st.selectedPreset.maxFreqHz * 1.35) : 2200
        );
        processDetectedPitch(
          result.frequency,
          result.lockedMidi,
          result.clarity,
          result.rmsDb,
          result.envelopePhase,
          result.isSustainLocked,
          result.isNoisyEnvironment
        );
        rafLoopRef.current = requestAnimationFrame(analyzeLoop);
      };

      rafLoopRef.current = requestAnimationFrame(analyzeLoop);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '无法访问麦克风，请检查浏览器麦克风权限设置';
      setMicError(
        `麦克风启动失败：${message}（您仍可使用「模拟调弦」或「Sound It 原声耳调」功能）`
      );
      setIsMicListening(false);
    }
  }, [processDetectedPitch, tunerMode]);

  // Stop mic or tone when switching away from Tuner tab
  useEffect(() => {
    if (activeTool !== 'tuner') {
      if (isMicListening) stopMicrophone();
      setIsSimulating(false);
      toneGenRef.current.stopContinuous();
    }
  }, [activeTool, isMicListening, stopMicrophone]);

  // Interactive Simulation Mode (demonstrates Attack -> Sustain Lock -> Decay Hold)
  useEffect(() => {
    if (!isSimulating) return;
    let simFrame = 0;
    let rafId: number;

    const runSimulation = () => {
      simFrame += 1;
      const st = stateRef.current;
      const baseHz = midiToFrequency(st.targetMidi, st.a4Hz, st.temperament);

      const cycle = (simFrame % 360) / 360;
      let simCents = 0;
      let phase: EnvelopePhase = 'sustain';
      let sustainLocked = true;

      if (cycle < 0.08) {
        // Pluck Attack phase (filtered transient)
        phase = 'attack';
        sustainLocked = false;
        simCents = -18 + Math.sin(simFrame * 0.4) * 2;
      } else if (cycle < 0.48) {
        // Smoothly turning peg toward 0 cents during Sustain
        const progress = (cycle - 0.08) / 0.4;
        simCents = -18 * (1 - progress) + Math.sin(simFrame * 0.15) * 0.5;
      } else if (cycle < 0.85) {
        // Locked in Sustain around 0.0 cents
        simCents = Math.sin(simFrame * 0.1) * 0.25;
      } else {
        // Decay tail hold
        phase = 'decay';
        simCents = 0.1;
      }

      const simFreq = baseHz * Math.pow(2, simCents / 1200);
      const simDb = phase === 'decay' ? -38 : -18 + Math.sin(simFrame * 0.08) * 2;
      processDetectedPitch(
        simFreq,
        st.targetMidi,
        0.96,
        simDb,
        phase,
        sustainLocked,
        false
      );

      rafId = requestAnimationFrame(runSimulation);
    };

    rafId = requestAnimationFrame(runSimulation);
    return () => cancelAnimationFrame(rafId);
  }, [isSimulating, processDetectedPitch]);

  // Handle Sound It continuous reference tone mode
  useEffect(() => {
    if (tunerMode === 'sound-it' && activeTool === 'tuner') {
      if (isMicListening) {
        stopMicrophone();
      }
      setIsSimulating(false);
      const hz = midiToFrequency(targetMidi, a4Hz, temperament);
      toneGenRef.current.startContinuous(hz, resolvedTimbre, toneVolume);
    } else {
      toneGenRef.current.stopContinuous();
    }
    return () => {
      toneGenRef.current.stopContinuous();
    };
  }, [tunerMode, activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tunerMode === 'sound-it') {
      const hz = midiToFrequency(targetMidi, a4Hz, temperament);
      toneGenRef.current.updateFrequency(hz);
    }
  }, [targetMidi, a4Hz, temperament, tunerMode]);

  useEffect(() => {
    if (tunerMode === 'sound-it') {
      toneGenRef.current.updateTimbre(resolvedTimbre);
    }
  }, [resolvedTimbre, tunerMode]);

  useEffect(() => {
    if (tunerMode === 'sound-it') {
      toneGenRef.current.updateVolume(toneVolume);
    }
  }, [toneVolume, tunerMode]);

  // Handlers for preset / tuning / string selection
  const handleSelectPreset = (preset: InstrumentPreset) => {
    setSelectedPreset(preset);
    const firstTuning = preset.tunings[0];
    setSelectedTuning(firstTuning);
    setTunedStrings(new Set());
    if (firstTuning.strings.length > 0) {
      const initialStr = firstTuning.strings[0];
      setTargetMidi(initialStr.midi);
      setCurrentFloatMidi(initialStr.midi);
      const timbre =
        waveform !== 'auto-instrument'
          ? waveform
          : firstTuning.defaultTimbre || preset.defaultTimbre;
      if (!isMicListening && tunerMode !== 'sound-it') {
        const hz = midiToFrequency(initialStr.midi, a4Hz, temperament);
        toneGenRef.current.triggerPluck(hz, toneVolume, timbre);
      }
    }
  };

  const handleSelectTuning = (tuning: TuningVariant) => {
    setSelectedTuning(tuning);
    setTunedStrings(new Set());
    if (tuning.strings.length > 0) {
      setTargetMidi(tuning.strings[0].midi);
      setCurrentFloatMidi(tuning.strings[0].midi);
    }
  };

  const handleSelectString = (str: StringSpec, playPreview: boolean) => {
    setTargetMidi(str.midi);
    setCurrentFloatMidi(str.midi);
    const hz = midiToFrequency(str.midi, a4Hz, temperament);
    if (tunerMode === 'sound-it') {
      toneGenRef.current.updateFrequency(hz);
    } else if (playPreview && !isMicListening) {
      toneGenRef.current.triggerPluck(hz, toneVolume, resolvedTimbre);
    }
  };

  const handleSelectTapeMidi = (midi: number) => {
    setTargetMidi(midi);
    setCurrentFloatMidi(midi);
    const hz = midiToFrequency(midi, a4Hz, temperament);
    if (tunerMode === 'tune-auto') {
      setTunerMode('tune-manual');
    }
    if (tunerMode !== 'sound-it' && !isMicListening) {
      toneGenRef.current.triggerPluck(hz, toneVolume, resolvedTimbre);
    }
  };

  const handleResetDefaults = () => {
    setA4Hz(440);
    setTemperament('equal');
    setNotationStyle('letter');
    setDampingMode('balanced');
    setNoiseGateDb(-50);
    setDeepNoiseSuppression(false);
    setWaveform('auto-instrument');
    setToneVolume(0.65);
    setShowPitchTrail(true);
    setEnableLockChime(true);
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col justify-between pb-safe">
      {/* Top Header & Multi-Tool Suite Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#090d14]/90 border-b border-slate-800/80 px-3 sm:px-6 pt-2.5 pb-2">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Row 1: Brand & Quick Action Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/25 to-sky-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                    TuneKit <span className="text-emerald-400 font-mono">Pro</span>
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-800/90 text-slate-400 border border-slate-700/60">
                    全平台专业音乐工具站
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  延音稳态锁频调音器 · 物理建模原声 · 节拍器 · 和弦库 · 练耳
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5">
              {/* Noise Suppression Quick Toggle */}
              {activeTool === 'tuner' && (
                <button
                  type="button"
                  onClick={() => setDeepNoiseSuppression((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all ${
                    deepNoiseSuppression
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="开启硬件级带通滤波与谐波抗噪，过滤嘈杂环境杂音与说话声"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{deepNoiseSuppression ? '强效降噪中' : '抗噪降噪'}</span>
                </button>
              )}

              {/* Demo Simulation Button */}
              {activeTool === 'tuner' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSimulating) {
                      setIsSimulating(false);
                      setHasSignal(false);
                      setMeasuredFreq(null);
                      setEnvelopePhase('idle');
                    } else {
                      if (isMicListening) stopMicrophone();
                      if (tunerMode === 'sound-it') setTunerMode('tune-auto');
                      setIsSimulating(true);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all ${
                    isSimulating
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="演示拨弦瞬态过滤与延音稳态锁定过程"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isSimulating ? '停止演示' : '模拟调弦'}
                  </span>
                </button>
              )}

              {/* Primary Microphone Toggle Button */}
              {activeTool === 'tuner' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isMicListening) {
                      stopMicrophone();
                    } else {
                      startMicrophone();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    isMicListening
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.45)] hover:bg-emerald-400'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                  }`}
                >
                  {isMicListening ? (
                    <>
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>正在测音</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>开启麦克风</span>
                    </>
                  )}
                </button>
              )}

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                title="声学音色、降噪与律制设置"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: 5-in-1 Music Tool Suite Switcher Tabs */}
          <nav
            aria-label="音乐工具导航"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5"
          >
            {[
              { id: 'tuner', label: '专业调音器', icon: Gauge },
              { id: 'metronome', label: '节拍器 & 测速', icon: Timer },
              { id: 'chords', label: '和弦指法库', icon: Guitar },
              { id: 'ear-trainer', label: '音感练耳 & 音叉', icon: Headphones },
              { id: 'decibel', label: '环境分贝仪', icon: BarChart3 },
            ].map((tab) => {
              const IconComp = tab.icon;
              const active = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTool(tab.id as ActiveToolTab)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    active
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900/70 text-slate-400 border-slate-800/90 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-3 flex flex-col justify-between gap-3">
        {/* Tool 1: Precision Instrument Tuner */}
        {activeTool === 'tuner' && (
          <>
            {/* Smart Noisy Environment Alert Banner (Requirement 4!) */}
            {isMicListening &&
              isNoisyEnvironment &&
              !deepNoiseSuppression &&
              !noiseAlertDismissed && (
                <div className="rounded-xl bg-amber-950/75 border border-amber-500/50 px-3.5 py-2.5 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>检测到周围环境较嘈杂：</strong>
                      外界谈话或背景噪音可能影响拾音稳定性，建议开启针对当前乐器频段的强效带通降噪。
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeepNoiseSuppression(true)}
                      className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors"
                    >
                      一键开启强效降噪
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoiseAlertDismissed(true)}
                      className="text-amber-300 hover:text-white px-1.5"
                    >
                      忽略
                    </button>
                  </div>
                </div>
              )}

            {/* Microphone Permission Error Banner */}
            {micError && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-500/40 px-3.5 py-2 text-xs text-rose-200 flex items-center justify-between gap-2">
                <span>{micError}</span>
                <button
                  type="button"
                  onClick={() => setMicError(null)}
                  className="text-rose-400 hover:text-white shrink-0 font-semibold"
                >
                  关闭
                </button>
              </div>
            )}

            {/* 1. Dual-Scale Damped Analog Meter with Sustain Lock */}
            <GStringsDialMeter
              targetNote={targetNote}
              measuredFreq={measuredFreq}
              centsOffset={centsOffset}
              hasSignal={hasSignal}
              clarity={clarity}
              rmsDb={rmsDb}
              envelopePhase={envelopePhase}
              isSustainLocked={isSustainLocked}
              deepNoiseSuppression={deepNoiseSuppression}
              dampingMode={dampingMode}
              notationStyle={notationStyle}
              showPitchTrail={showPitchTrail}
              matchedStringLabel={
                matchedString
                  ? `${matchedString.label} · ${matchedString.description || ''}`
                  : null
              }
              activeTimbreLabel={activeTimbreLabel}
              isManualLocked={tunerMode === 'tune-manual'}
              isSoundItMode={tunerMode === 'sound-it'}
            />

            {/* 2. Scrolling Note & Frequency Tape */}
            <ScrollingNoteTape
              currentFloatMidi={currentFloatMidi}
              targetMidi={targetMidi}
              a4Hz={a4Hz}
              temperament={temperament}
              notationStyle={notationStyle}
              instrumentMidis={instrumentMidis}
              onSelectMidi={handleSelectTapeMidi}
              hasSignal={hasSignal}
              isSoundItMode={tunerMode === 'sound-it'}
            />

            {/* 3. Instrument Presets & Interactive String Selector */}
            <InstrumentStringsPanel
              selectedPreset={selectedPreset}
              selectedTuning={selectedTuning}
              targetMidi={targetMidi}
              a4Hz={a4Hz}
              temperament={temperament}
              snapToStringsOnly={snapToStringsOnly}
              isManualLocked={tunerMode === 'tune-manual'}
              tunedStrings={tunedStrings}
              onSelectPreset={handleSelectPreset}
              onSelectTuning={handleSelectTuning}
              onSelectString={handleSelectString}
              onToggleSnapToStrings={() => setSnapToStringsOnly((v) => !v)}
              onResetTunedStrings={() => setTunedStrings(new Set())}
            />

            {/* 4. 3-Button Bottom Mode Bar (Tune Auto | Tune Manual | Sound It) */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setTunerMode('tune-auto');
                  if (!isMicListening && !isSimulating) {
                    startMicrophone();
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm border transition-all ${
                  tunerMode === 'tune-auto'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0d121b] text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <div className="text-center sm:text-left">
                  <div>Tune Auto</div>
                  <div className="text-[10px] font-normal opacity-75">
                    延音稳态自动测音
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTunerMode('tune-manual');
                  if (!isMicListening && !isSimulating) {
                    startMicrophone();
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm border transition-all ${
                  tunerMode === 'tune-manual'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.2)]'
                    : 'bg-[#0d121b] text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Crosshair className="w-4 h-4 text-amber-400" />
                <div className="text-center sm:text-left">
                  <div>Tune Manual</div>
                  <div className="text-[10px] font-normal opacity-75">
                    手动锁弦窄带抗噪
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (tunerMode === 'sound-it') {
                    setTunerMode('tune-auto');
                  } else {
                    setTunerMode('sound-it');
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm border transition-all ${
                  tunerMode === 'sound-it'
                    ? 'bg-sky-500/25 text-sky-200 border-sky-400/70 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                    : 'bg-[#0d121b] text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {tunerMode === 'sound-it' ? (
                  <Volume2 className="w-4 h-4 text-sky-300 animate-bounce" />
                ) : (
                  <VolumeX className="w-4 h-4 text-sky-400" />
                )}
                <div className="text-center sm:text-left">
                  <div>Sound It</div>
                  <div className="text-[10px] font-normal opacity-75">
                    {tunerMode === 'sound-it'
                      ? `停止${activeTimbreLabel}`
                      : `播放${activeTimbreLabel}耳调`}
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Tool 2: Visual Pendulum Metronome & Tap BPM */}
        {activeTool === 'metronome' && <MetronomeTool />}

        {/* Tool 3: Interactive Guitar & Ukulele Chord Library */}
        {activeTool === 'chords' && <ChordLibraryTool a4Hz={a4Hz} />}

        {/* Tool 4: Pitch Ear Trainer & Arbitrary Frequency Generator */}
        {activeTool === 'ear-trainer' && <EarTrainerTool a4Hz={a4Hz} />}

        {/* Tool 5: Acoustic Decibel & Room Noise Analyzer */}
        {activeTool === 'decibel' && <DecibelMeterTool />}
      </main>

      {/* SEO Structured Guide, Tuning Reference Table, FAQ & Compliance Footer */}
      <SeoKnowledgeFooter />

      {/* Pro Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        a4Hz={a4Hz}
        onChangeA4Hz={setA4Hz}
        temperament={temperament}
        onChangeTemperament={setTemperament}
        notationStyle={notationStyle}
        onChangeNotationStyle={setNotationStyle}
        dampingMode={dampingMode}
        onChangeDampingMode={setDampingMode}
        noiseGateDb={noiseGateDb}
        onChangeNoiseGateDb={setNoiseGateDb}
        deepNoiseSuppression={deepNoiseSuppression}
        onChangeDeepNoiseSuppression={setDeepNoiseSuppression}
        waveform={waveform}
        onChangeWaveform={setWaveform}
        toneVolume={toneVolume}
        onChangeToneVolume={setToneVolume}
        showPitchTrail={showPitchTrail}
        onChangeShowPitchTrail={setShowPitchTrail}
        enableLockChime={enableLockChime}
        onChangeEnableLockChime={setEnableLockChime}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};

export default App;
