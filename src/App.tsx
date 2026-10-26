import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  INSTRUMENT_PRESETS,
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
import { PitchProcessor } from './audio/pitchDetector';
import { ReferenceToneGenerator } from './audio/toneGenerator';
import { GStringsDialMeter } from './components/GStringsDialMeter';
import { ScrollingNoteTape } from './components/ScrollingNoteTape';
import { InstrumentStringsPanel } from './components/InstrumentStringsPanel';
import { SettingsModal } from './components/SettingsModal';
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
  Smartphone,
} from 'lucide-react';

export const App: React.FC = () => {
  // Instrument & Tuning State
  const [selectedPreset, setSelectedPreset] = useState<InstrumentPreset>(
    INSTRUMENT_PRESETS[1] // Default to Guitar Standard (most popular), with 1-click access to Chromatic/Ukulele/Guzheng/Erhu/Violin
  );
  const [selectedTuning, setSelectedTuning] = useState<TuningVariant>(
    INSTRUMENT_PRESETS[1].tunings[0]
  );

  // gStrings Core Mode: 'tune-auto' | 'tune-manual' | 'sound-it'
  const [tunerMode, setTunerMode] = useState<TunerMode>('tune-auto');
  const [snapToStringsOnly, setSnapToStringsOnly] = useState<boolean>(true);

  // Calibration & Pro Settings
  const [a4Hz, setA4Hz] = useState<number>(440);
  const [temperament, setTemperament] = useState<TemperamentId>('equal');
  const [notationStyle, setNotationStyle] = useState<NotationStyle>('letter');
  const [dampingMode, setDampingMode] = useState<'fast' | 'balanced' | 'smooth'>('balanced');
  const [noiseGateDb, setNoiseGateDb] = useState<number>(-54);
  const [waveform, setWaveform] = useState<ToneWaveform>('plucked');
  const [toneVolume, setToneVolume] = useState<number>(0.55);
  const [showPitchTrail, setShowPitchTrail] = useState<boolean>(true);
  const [enableLockChime, setEnableLockChime] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Target & Measured Pitch State
  const [targetMidi, setTargetMidi] = useState<number>(69); // Default A4 (or first string)
  const [measuredFreq, setMeasuredFreq] = useState<number | null>(null);
  const [currentFloatMidi, setCurrentFloatMidi] = useState<number>(69);
  const [centsOffset, setCentsOffset] = useState<number>(0);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [clarity, setClarity] = useState<number>(0);
  const [rmsDb, setRmsDb] = useState<number>(-100);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());

  // Microphone & Simulation State
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafLoopRef = useRef<number | null>(null);
  const pitchProcessorRef = useRef<PitchProcessor>(new PitchProcessor());
  const toneGenRef = useRef<ReferenceToneGenerator>(new ReferenceToneGenerator());
  const inTuneTimerRef = useRef<{ midi: number; frames: number }>({ midi: -1, frames: 0 });

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
      enableLockChime,
    };
  }, [
    tunerMode,
    snapToStringsOnly,
    selectedPreset,
    selectedTuning,
    targetMidi,
    a4Hz,
    temperament,
    noiseGateDb,
    enableLockChime,
  ]);

  // Set of MIDI numbers in current instrument tuning
  const instrumentMidis = useMemo(() => {
    return new Set(selectedTuning.strings.map((s) => s.midi));
  }, [selectedTuning]);

  // Matched string label if targetMidi matches one of the current preset's strings
  const matchedString = useMemo(() => {
    return selectedTuning.strings.find((s) => s.midi === targetMidi) || null;
  }, [selectedTuning, targetMidi]);

  const targetNote = useMemo(() => {
    return getNoteInfo(targetMidi, a4Hz, temperament);
  }, [targetMidi, a4Hz, temperament]);

  // Given a detected frequency, update the tuner state (Auto or Manual)
  const processDetectedPitch = useCallback(
    (freq: number | null, conf: number, db: number) => {
      const st = stateRef.current;
      setRmsDb(db);
      setClarity(conf);

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
          // Find closest string in the selected instrument preset
          let bestString = st.selectedTuning.strings[0];
          let minDiff = Infinity;
          for (const str of st.selectedTuning.strings) {
            const strFreq = midiToFrequency(str.midi, st.a4Hz, st.temperament);
            const diffCents = Math.abs(getCentsOffset(freq, strFreq));
            if (diffCents < minDiff) {
              minDiff = diffCents;
              bestString = str;
            }
          }
          chosenMidi = bestString.midi;
        } else {
          // Full chromatic auto-detection
          chosenMidi = Math.max(21, Math.min(108, Math.round(floatMidi)));
        }
        setTargetMidi(chosenMidi);
      }

      const targetHz = midiToFrequency(chosenMidi, st.a4Hz, st.temperament);
      const rawCents = getCentsOffset(freq, targetHz);
      const clampedCents = Math.max(-50, Math.min(50, rawCents));
      setCentsOffset(clampedCents);

      // Check if string stays locked in tune (|cents| <= 2.5 for ~32 frames)
      if (Math.abs(rawCents) <= 2.5) {
        if (inTuneTimerRef.current.midi === chosenMidi) {
          inTuneTimerRef.current.frames += 1;
          if (inTuneTimerRef.current.frames === 32) {
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
    pitchProcessorRef.current.reset();
    setIsMicListening(false);
    setHasSignal(false);
    setMeasuredFreq(null);
    setRmsDb(-100);
  }, []);

  // Start Microphone Listening (with raw musical instrument constraints!)
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
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      pitchProcessorRef.current.reset();
      setIsMicListening(true);

      const buffer = new Float32Array(analyser.fftSize);
      const analyzeLoop = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const result = pitchProcessorRef.current.detect(
          buffer,
          audioCtxRef.current.sampleRate,
          stateRef.current.noiseGateDb
        );
        processDetectedPitch(result.frequency, result.clarity, result.rmsDb);
        rafLoopRef.current = requestAnimationFrame(analyzeLoop);
      };

      rafLoopRef.current = requestAnimationFrame(analyzeLoop);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '无法访问麦克风，请检查浏览器麦克风权限设置';
      setMicError(`麦克风启动失败：${message}（您仍可使用「模拟演示」或「Sound It 发音耳调」功能）`);
      setIsMicListening(false);
    }
  }, [processDetectedPitch, tunerMode]);

  // Interactive Simulation Mode (so user can test the dial & string lock immediately without a live instrument)
  useEffect(() => {
    if (!isSimulating) return;
    let simFrame = 0;
    let rafId: number;

    const runSimulation = () => {
      simFrame += 1;
      const st = stateRef.current;
      const baseHz = midiToFrequency(st.targetMidi, st.a4Hz, st.temperament);

      // Simulate plucking a string slightly flat (-26 cents) and smoothly tuning the peg up into 0.0 cent lock!
      const cycle = (simFrame % 360) / 360; // 6-second cycle at 60fps
      let simCents = 0;
      if (cycle < 0.35) {
        // Starts around -28 cents with slight string vibrato
        const progress = cycle / 0.35;
        simCents = -28 * (1 - progress * 0.4) + Math.sin(simFrame * 0.25) * 1.4;
      } else if (cycle < 0.65) {
        // Turning tuning peg smoothly toward 0 cents
        const progress = (cycle - 0.35) / 0.3;
        simCents = -16.8 * (1 - progress) + Math.sin(simFrame * 0.2) * 0.8;
      } else {
        // Locked in tune around 0 cents (±0.4 cent micro-vibrato)
        simCents = Math.sin(simFrame * 0.15) * 0.45;
      }

      const simFreq = baseHz * Math.pow(2, simCents / 1200);
      const simDb = -18 + Math.sin(simFrame * 0.1) * 3;
      processDetectedPitch(simFreq, 0.96, simDb);

      rafId = requestAnimationFrame(runSimulation);
    };

    rafId = requestAnimationFrame(runSimulation);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isSimulating, processDetectedPitch]);

  // Handle Sound It continuous reference tone mode
  useEffect(() => {
    if (tunerMode === 'sound-it') {
      if (isMicListening) {
        stopMicrophone();
      }
      setIsSimulating(false);
      const hz = midiToFrequency(targetMidi, a4Hz, temperament);
      toneGenRef.current.startContinuous(hz, waveform, toneVolume);
    } else {
      toneGenRef.current.stopContinuous();
    }
    return () => {
      toneGenRef.current.stopContinuous();
    };
  }, [tunerMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update frequency/waveform/volume dynamically while in Sound It mode
  useEffect(() => {
    if (tunerMode === 'sound-it') {
      const hz = midiToFrequency(targetMidi, a4Hz, temperament);
      toneGenRef.current.updateFrequency(hz);
    }
  }, [targetMidi, a4Hz, temperament, tunerMode]);

  useEffect(() => {
    if (tunerMode === 'sound-it') {
      toneGenRef.current.updateWaveform(waveform);
    }
  }, [waveform, tunerMode]);

  useEffect(() => {
    if (tunerMode === 'sound-it') {
      toneGenRef.current.updateVolume(toneVolume);
    }
  }, [toneVolume, tunerMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      toneGenRef.current.stopContinuous();
    };
  }, [stopMicrophone]);

  // Handlers for preset / tuning / string selection
  const handleSelectPreset = (preset: InstrumentPreset) => {
    setSelectedPreset(preset);
    const firstTuning = preset.tunings[0];
    setSelectedTuning(firstTuning);
    setTunedStrings(new Set());
    if (firstTuning.strings.length > 0) {
      // Pick standard A4 or middle string
      const a4Str = firstTuning.strings.find((s) => s.midi === 69) || firstTuning.strings[0];
      setTargetMidi(a4Str.midi);
      setCurrentFloatMidi(a4Str.midi);
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
      toneGenRef.current.triggerPluck(hz, toneVolume);
    }
  };

  const handleSelectTapeMidi = (midi: number) => {
    setTargetMidi(midi);
    setCurrentFloatMidi(midi);
    const hz = midiToFrequency(midi, a4Hz, temperament);
    if (tunerMode === 'tune-auto') {
      // Switching via tape locks target note in manual mode so user can tune to it
      setTunerMode('tune-manual');
    }
    if (tunerMode !== 'sound-it' && !isMicListening) {
      toneGenRef.current.triggerPluck(hz, toneVolume);
    }
  };

  const handleResetDefaults = () => {
    setA4Hz(440);
    setTemperament('equal');
    setNotationStyle('letter');
    setDampingMode('balanced');
    setNoiseGateDb(-54);
    setWaveform('plucked');
    setToneVolume(0.55);
    setShowPitchTrail(true);
    setEnableLockChime(true);
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col justify-between pb-safe">
      {/* Top Navigation & Status Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#090d14]/85 border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/25 to-sky-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  gStrings <span className="text-emerald-400 font-mono">Pro</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-800/90 text-slate-400 border border-slate-700/60">
                  <Smartphone className="w-2.5 h-2.5" /> 全平台 PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                精密双刻度机械阻尼表盘 · 乐器调音器
              </p>
            </div>
          </div>

          {/* Center Calibration Quick Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
              title="点击调整 A4 基准频率与律制"
            >
              <span className="text-emerald-400 font-bold">A4={a4Hz}Hz</span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {temperament === 'equal'
                  ? '平均律'
                  : temperament === 'pythagorean'
                  ? '五度律'
                  : temperament === 'just'
                  ? '纯律'
                  : '中庸律'}
              </span>
            </button>

            {/* Demo Simulation Button (Great for testing on desktop/mobile anytime) */}
            <button
              type="button"
              onClick={() => {
                if (isSimulating) {
                  setIsSimulating(false);
                  setHasSignal(false);
                  setMeasuredFreq(null);
                } else {
                  if (isMicListening) stopMicrophone();
                  if (tunerMode === 'sound-it') setTunerMode('tune-auto');
                  setIsSimulating(true);
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all ${
                isSimulating
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="模拟拨弦调音过程，无需乐器即可预览表盘动态响应"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSimulating ? '停止模拟' : '模拟调弦'}
              </span>
            </button>

            {/* Primary Microphone Toggle Button */}
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

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="专业调音设置"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-3 flex flex-col justify-between gap-3">
        {/* Microphone Permission Error Banner (if any) */}
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

        {/* 1. Top Centerpiece: gStrings Dual-Scale Damped Analog Meter */}
        <GStringsDialMeter
          targetNote={targetNote}
          measuredFreq={measuredFreq}
          centsOffset={centsOffset}
          hasSignal={hasSignal}
          clarity={clarity}
          rmsDb={rmsDb}
          dampingMode={dampingMode}
          notationStyle={notationStyle}
          showPitchTrail={showPitchTrail}
          matchedStringLabel={
            matchedString
              ? `${matchedString.label} · ${matchedString.description || ''}`
              : null
          }
          isManualLocked={tunerMode === 'tune-manual'}
          isSoundItMode={tunerMode === 'sound-it'}
        />

        {/* 2. Middle gStrings Signature Scrolling Note & Frequency Tape */}
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

        {/* 4. Classic gStrings 3-Button Bottom Mode Bar (Tune Auto | Tune Manual | Sound It) */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          {/* Mode 1: Tune Auto */}
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
                自动识别测音
              </div>
            </div>
          </button>

          {/* Mode 2: Tune Manual (Lock Target String/Note) */}
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
                手动锁定目标弦
              </div>
            </div>
          </button>

          {/* Mode 3: Sound It (Reference Pitch Generator) */}
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
                {tunerMode === 'sound-it' ? '点击停止基准音' : '播放标准音耳调'}
              </div>
            </div>
          </button>
        </div>
      </main>

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
