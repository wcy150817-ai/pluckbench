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
import {
  REGIONAL_THEMES,
  REGION_TO_LANG,
  GeoRegionCode,
  ColorMode,
  UI_TEXT,
  getInitialGeoRegion,
  detectUserGeoRegion,
} from './i18n/localeTheme';
import { PitchProcessor, EnvelopePhase } from './audio/pitchDetector';
import { ReferenceToneGenerator } from './audio/toneGenerator';
import { GStringsDialMeter } from './components/GStringsDialMeter';
import { ScrollingNoteTape } from './components/ScrollingNoteTape';
import { InstrumentStringsPanel } from './components/InstrumentStringsPanel';
import { SettingsModal } from './components/SettingsModal';
import { MicPermissionModal } from './components/MicPermissionModal';
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
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

type ActiveToolTab = 'tuner' | 'metronome' | 'chords' | 'ear-trainer' | 'decibel';

export const App: React.FC = () => {
  // Multi-Tool Navigation State (auto-detects dedicated SEO route path)
  const [activeTool, setActiveTool] = useState<ActiveToolTab>(() => {
    if (typeof window === 'undefined') return 'tuner';
    const p = window.location.pathname.toLowerCase();
    if (p.includes('metronome')) return 'metronome';
    if (p.includes('chord')) return 'chords';
    if (p.includes('ear-trainer')) return 'ear-trainer';
    if (p.includes('decibel')) return 'decibel';
    return 'tuner';
  });

  // IP Geolocation -> Region (CN | US | EU | JP) + Day/Night Color Mode (dark | light)
  const [region, setRegion] = useState<GeoRegionCode>(() => getInitialGeoRegion());
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [showRegionMenu, setShowRegionMenu] = useState<boolean>(false);

  const lang = REGION_TO_LANG[region];
  const theme = REGIONAL_THEMES[region][colorMode];
  const t = UI_TEXT[lang];

  // Auto-detect IP Country -> Region & Language on mount (also supports ?region=CN|US|EU|JP & ?mode=dark|light for testing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forcedRegion = params.get('region')?.toUpperCase();
    const forcedMode = params.get('mode')?.toLowerCase();

    if (forcedMode === 'light' || forcedMode === 'dark') {
      setColorMode(forcedMode);
    }

    if (
      forcedRegion === 'CN' ||
      forcedRegion === 'US' ||
      forcedRegion === 'EU' ||
      forcedRegion === 'JP'
    ) {
      setRegion(forcedRegion);
      return;
    }

    detectUserGeoRegion().then((info) => {
      setRegion(info.region);
    });
  }, []);

  // Update document lang attribute dynamically for strict language purity
  useEffect(() => {
    document.documentElement.lang =
      lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : 'en';
  }, [lang]);

  // Instrument & Tuning State (auto-matches dedicated SEO route path like /ukulele-tuner, /guzheng-tuner, etc.)
  const initialPreset = useMemo(() => {
    if (typeof window === 'undefined') return INSTRUMENT_PRESETS[0];
    const p = window.location.pathname.toLowerCase();
    if (p.includes('ukulele')) return INSTRUMENT_PRESETS.find((x) => x.id === 'ukulele') || INSTRUMENT_PRESETS[0];
    if (p.includes('violin')) return INSTRUMENT_PRESETS.find((x) => x.id === 'violin') || INSTRUMENT_PRESETS[0];
    if (p.includes('guzheng')) return INSTRUMENT_PRESETS.find((x) => x.id === 'guzheng') || INSTRUMENT_PRESETS[0];
    if (p.includes('bass')) return INSTRUMENT_PRESETS.find((x) => x.id === 'bass') || INSTRUMENT_PRESETS[0];
    if (p.includes('erhu') || p.includes('pipa')) return INSTRUMENT_PRESETS.find((x) => x.id === 'erhu-pipa') || INSTRUMENT_PRESETS[0];
    return INSTRUMENT_PRESETS[0];
  }, []);

  const [selectedPreset, setSelectedPreset] = useState<InstrumentPreset>(
    initialPreset
  );
  const [selectedTuning, setSelectedTuning] = useState<TuningVariant>(
    initialPreset.tunings[0]
  );

  // Default to 'tune-manual' (String-First Workflow: select which string to tune first!)
  const [tunerMode, setTunerMode] = useState<TunerMode>('tune-manual');
  const [autoAdvanceNextString, setAutoAdvanceNextString] = useState<boolean>(false);

  // Calibration, Timbre & Noise Reduction Settings
  const [a4Hz, setA4Hz] = useState<number>(440);
  const [temperament, setTemperament] = useState<TemperamentId>('equal');
  const [notationStyle, setNotationStyle] = useState<NotationStyle>('letter');
  const [dampingMode, setDampingMode] = useState<'fast' | 'balanced' | 'smooth'>('balanced');
  const [noiseGateDb, setNoiseGateDb] = useState<number>(-48);
  const [deepNoiseSuppression, setDeepNoiseSuppression] = useState<boolean>(false);
  const [waveform, setWaveform] = useState<ToneWaveform>('auto-instrument');
  const [toneVolume, setToneVolume] = useState<number>(0.65);
  const [showPitchTrail, setShowPitchTrail] = useState<boolean>(true);
  const [enableLockChime, setEnableLockChime] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Target & Stabilized Pitch State
  const [targetMidi, setTargetMidi] = useState<number>(
    initialPreset.tunings[0]?.strings[0]?.midi ?? 40
  );
  const [measuredFreq, setMeasuredFreq] = useState<number | null>(null);
  const [currentFloatMidi, setCurrentFloatMidi] = useState<number>(
    initialPreset.tunings[0]?.strings[0]?.midi ?? 40
  );
  const [centsOffset, setCentsOffset] = useState<number>(0);
  const [hasSignal, setHasSignal] = useState<boolean>(false);
  const [clarity, setClarity] = useState<number>(0);
  const [rmsDb, setRmsDb] = useState<number>(-100);
  const [envelopePhase, setEnvelopePhase] = useState<EnvelopePhase>('idle');
  const [isSustainLocked, setIsSustainLocked] = useState<boolean>(false);
  const [isNoisyEnvironment, setIsNoisyEnvironment] = useState<boolean>(false);
  const [noiseAlertDismissed, setNoiseAlertDismissed] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());

  // Microphone & Simulation State
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isMicModalOpen, setIsMicModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname.toLowerCase();
    if (
      p.includes('metronome') ||
      p.includes('chord') ||
      p.includes('ear-trainer') ||
      p.includes('decibel')
    ) {
      return false;
    }
    return true;
  });
  const hasPromptedMicRef = useRef<boolean>(isMicModalOpen);

  // Audio & DSP Filter Chain Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafLoopRef = useRef<number | null>(null);
  const pitchProcessorRef = useRef<PitchProcessor>(new PitchProcessor());
  const toneGenRef = useRef<ReferenceToneGenerator>(new ReferenceToneGenerator());
  const holdProgressRef = useRef<{ midi: number; progress: number; chimed: boolean }>({
    midi: 40,
    progress: 0,
    chimed: false,
  });

  // Resolve authentic acoustic instrument timbre
  const resolvedTimbre = useMemo(() => {
    if (waveform !== 'auto-instrument') return waveform;
    return selectedTuning.defaultTimbre || selectedPreset.defaultTimbre || 'acoustic-guitar';
  }, [waveform, selectedTuning, selectedPreset]);

  const activeTimbreLabel = useMemo(() => {
    const found = TIMBRE_OPTIONS.find((item) => item.id === resolvedTimbre);
    return found ? found.name[lang] : '';
  }, [resolvedTimbre, lang]);

  // Keep latest state in refs for inside requestAnimationFrame loop
  const stateRef = useRef({
    tunerMode,
    autoAdvanceNextString,
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
      autoAdvanceNextString,
      selectedPreset,
      selectedTuning,
      targetMidi,
      a4Hz,
      temperament,
      noiseGateDb,
      deepNoiseSuppression,
      enableLockChime,
    };

    if (highPassFilterRef.current && lowPassFilterRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (tunerMode === 'tune-manual') {
        const targetHz = midiToFrequency(targetMidi, a4Hz, temperament);
        highPassFilterRef.current.frequency.setTargetAtTime(
          Math.max(22, targetHz * 0.68),
          now,
          0.04
        );
        lowPassFilterRef.current.frequency.setTargetAtTime(
          Math.min(2500, targetHz * 1.45),
          now,
          0.04
        );
      } else if (deepNoiseSuppression) {
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
      } else {
        highPassFilterRef.current.frequency.setTargetAtTime(26, now, 0.04);
        lowPassFilterRef.current.frequency.setTargetAtTime(2200, now, 0.04);
      }
    }
  }, [
    tunerMode,
    autoAdvanceNextString,
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

  // Process stabilized pitch & Hold-in-Small-Fluctuation-Zone Confirmation Chime!
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
        if (!holdProgressRef.current.chimed) {
          holdProgressRef.current.progress = Math.max(
            0,
            holdProgressRef.current.progress - 1.2
          );
          setHoldProgress(holdProgressRef.current.progress);
        }
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
          st.selectedTuning.strings.length > 0
        ) {
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

          if (currentStringDiff <= minDiff + 30) {
            chosenMidi = st.targetMidi;
          } else {
            chosenMidi = bestString.midi;
          }
        } else {
          chosenMidi =
            lockedMidiFromDetector ??
            Math.max(21, Math.min(108, Math.round(floatMidi)));
        }
        if (chosenMidi !== st.targetMidi) {
          setTargetMidi(chosenMidi);
          holdProgressRef.current = { midi: chosenMidi, progress: 0, chimed: false };
          setHoldProgress(0);
        }
      }

      const targetHz = midiToFrequency(chosenMidi, st.a4Hz, st.temperament);
      const rawCents = getCentsOffset(freq, targetHz);
      const clampedCents = Math.max(-50, Math.min(50, rawCents));
      setCentsOffset(clampedCents);

      if (holdProgressRef.current.midi !== chosenMidi) {
        holdProgressRef.current = { midi: chosenMidi, progress: 0, chimed: false };
      }

      if (Math.abs(rawCents) <= 5.5 && phase !== 'attack') {
        if (!holdProgressRef.current.chimed) {
          const nextProg = Math.min(100, holdProgressRef.current.progress + 2.2);
          holdProgressRef.current.progress = nextProg;
          setHoldProgress(nextProg);

          if (nextProg >= 100) {
            holdProgressRef.current.chimed = true;
            if (st.enableLockChime) {
              toneGenRef.current.playLockChime();
            }
            setTunedStrings((prev) => {
              const next = new Set(prev);
              next.add(chosenMidi);
              if (st.autoAdvanceNextString) {
                setTimeout(() => {
                  const nextUntuned = st.selectedTuning.strings.find(
                    (s) => s.midi !== chosenMidi && !next.has(s.midi)
                  );
                  if (nextUntuned) {
                    setTargetMidi(nextUntuned.midi);
                    setCurrentFloatMidi(nextUntuned.midi);
                    holdProgressRef.current = {
                      midi: nextUntuned.midi,
                      progress: 0,
                      chimed: false,
                    };
                    setHoldProgress(0);
                  }
                }, 1300);
              }
              return next;
            });
          }
        }
      } else if (!holdProgressRef.current.chimed) {
        const decayStep = Math.abs(rawCents) <= 10 ? 0.5 : 1.5;
        holdProgressRef.current.progress = Math.max(
          0,
          holdProgressRef.current.progress - decayStep
        );
        setHoldProgress(holdProgressRef.current.progress);
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

  // Start Microphone Listening
  const startMicrophone = useCallback(async () => {
    setMicError(null);
    setIsSimulating(false);
    toneGenRef.current.stopContinuous();
    if (tunerMode === 'sound-it') {
      setTunerMode('tune-manual');
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

      const humNotch = audioCtx.createBiquadFilter();
      humNotch.type = 'notch';
      humNotch.frequency.value = 50;
      humNotch.Q.value = 10;

      const targetHz = midiToFrequency(
        stateRef.current.targetMidi,
        stateRef.current.a4Hz,
        stateRef.current.temperament
      );

      const highPass = audioCtx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.Q.value = 0.707;
      highPass.frequency.value =
        stateRef.current.tunerMode === 'tune-manual'
          ? Math.max(22, targetHz * 0.68)
          : 26;

      const lowPass = audioCtx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.Q.value = 0.707;
      lowPass.frequency.value =
        stateRef.current.tunerMode === 'tune-manual'
          ? Math.min(2500, targetHz * 1.45)
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
      setIsMicModalOpen(false);

      const buffer = new Float32Array(analyser.fftSize);
      const analyzeLoop = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const st = stateRef.current;
        const expectedHz =
          st.tunerMode === 'tune-manual'
            ? midiToFrequency(st.targetMidi, st.a4Hz, st.temperament)
            : null;

        const result = pitchProcessorRef.current.detect(
          buffer,
          audioCtxRef.current.sampleRate,
          st.noiseGateDb,
          st.deepNoiseSuppression,
          st.deepNoiseSuppression
            ? Math.max(25, st.selectedPreset.minFreqHz * 0.72)
            : 27.5,
          st.deepNoiseSuppression
            ? Math.min(2200, st.selectedPreset.maxFreqHz * 1.35)
            : 2200,
          expectedHz
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
        err instanceof Error && err.message
          ? err.message
          : 'NotAllowedError: Microphone permission denied';
      setMicError(message);
      setIsMicListening(false);
      setIsMicModalOpen(true);
    }
  }, [processDetectedPitch, tunerMode]);

  useEffect(() => {
    if (activeTool !== 'tuner') {
      if (isMicListening) stopMicrophone();
      setIsSimulating(false);
      toneGenRef.current.stopContinuous();
    } else if (!hasPromptedMicRef.current && !isMicListening && !isSimulating) {
      hasPromptedMicRef.current = true;
      setIsMicModalOpen(true);
    }
  }, [activeTool, isMicListening, isSimulating, stopMicrophone]);

  // Interactive Simulation Mode
  useEffect(() => {
    if (!isSimulating) return;
    let simFrame = 0;
    let rafId: number;
    holdProgressRef.current = {
      midi: stateRef.current.targetMidi,
      progress: 0,
      chimed: false,
    };
    setHoldProgress(0);

    const runSimulation = () => {
      simFrame += 1;
      const st = stateRef.current;
      const baseHz = midiToFrequency(st.targetMidi, st.a4Hz, st.temperament);

      const cycle = (simFrame % 360) / 360;
      let simCents = 0;
      let phase: EnvelopePhase = 'sustain';
      const sustainLocked = true;

      if (cycle < 0.35) {
        const progress = cycle / 0.35;
        simCents = -16 * (1 - progress) + Math.sin(simFrame * 0.08) * 0.4;
      } else if (cycle < 0.88) {
        simCents = Math.sin(simFrame * 0.07) * 1.6;
      } else {
        phase = 'decay';
        simCents = 0.2;
      }

      const simFreq = baseHz * Math.pow(2, simCents / 1200);
      const simDb = phase === 'decay' ? -36 : -18 + Math.sin(simFrame * 0.06) * 1.5;
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

  const handleSelectPreset = (preset: InstrumentPreset) => {
    setSelectedPreset(preset);
    const firstTuning = preset.tunings[0];
    setSelectedTuning(firstTuning);
    setTunedStrings(new Set());
    if (firstTuning.strings.length > 0) {
      const initialStr = firstTuning.strings[0];
      setTargetMidi(initialStr.midi);
      setCurrentFloatMidi(initialStr.midi);
      holdProgressRef.current = { midi: initialStr.midi, progress: 0, chimed: false };
      setHoldProgress(0);
      pitchProcessorRef.current.reset();
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
      const first = tuning.strings[0];
      setTargetMidi(first.midi);
      setCurrentFloatMidi(first.midi);
      holdProgressRef.current = { midi: first.midi, progress: 0, chimed: false };
      setHoldProgress(0);
      pitchProcessorRef.current.reset();
    }
  };

  const handleSelectString = (str: StringSpec, playPreview: boolean) => {
    setTargetMidi(str.midi);
    setCurrentFloatMidi(str.midi);
    setCentsOffset(0);
    holdProgressRef.current = {
      midi: str.midi,
      progress: tunedStrings.has(str.midi) ? 100 : 0,
      chimed: tunedStrings.has(str.midi),
    };
    setHoldProgress(tunedStrings.has(str.midi) ? 100 : 0);
    pitchProcessorRef.current.reset();

    if (tunerMode === 'tune-auto') {
      setTunerMode('tune-manual');
    }

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
    setCentsOffset(0);
    holdProgressRef.current = { midi, progress: 0, chimed: false };
    setHoldProgress(0);
    pitchProcessorRef.current.reset();
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
    setNoiseGateDb(-48);
    setDeepNoiseSuppression(false);
    setWaveform('auto-instrument');
    setToneVolume(0.65);
    setShowPitchTrail(true);
    setEnableLockChime(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between pb-safe transition-colors duration-300"
      style={{
        backgroundColor: theme.bgPrimary,
        color: theme.textPrimary,
      }}
    >
      {/* Top Header & Multi-Tool Suite Navigation */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-6 pt-2 pb-1.5 transition-colors duration-300"
        style={{
          backgroundColor: theme.bgHeader,
          borderColor: theme.borderPrimary,
        }}
      >
        <div className="max-w-7xl mx-auto space-y-1.5">
          {/* Row 1: Brand, IP Region Switcher, Day/Night Toggle & Quick Controls */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {/* Brand Logo + Region + Day/Night Switcher */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${theme.accentHex}20`,
                  borderColor: `${theme.accentHex}66`,
                }}
              >
                <Radio className="w-4 h-4" style={{ color: theme.accentHex }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xs sm:text-base font-extrabold tracking-tight">
                    {t.brandName}{' '}
                    <span
                      className="font-mono"
                      style={{ color: theme.accentHex }}
                    >
                      {t.brandTag}
                    </span>
                    <span className="sr-only"> — {t.seoH1}</span>
                  </h1>

                  {/* Geo Region Selector Pill */}
                  <div className="relative">
                    <button
                      id="region-selector-btn"
                      type="button"
                      onClick={() => setShowRegionMenu((v) => !v)}
                      className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border flex items-center gap-1 transition-all"
                      style={{
                        backgroundColor: `${theme.secondaryHex}18`,
                        borderColor: `${theme.secondaryHex}55`,
                        color: theme.secondaryHex,
                      }}
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[115px] sm:max-w-none">
                        {t.regionName[region]}
                      </span>
                    </button>

                    {showRegionMenu && (
                      <div
                        className="absolute left-0 mt-1.5 w-60 rounded-xl border p-2 shadow-2xl z-50 space-y-1 text-xs"
                        style={{
                          backgroundColor: theme.bgCard,
                          borderColor: theme.borderPrimary,
                          color: theme.textPrimary,
                        }}
                      >
                        <div
                          className="px-2 py-1 text-[10px] font-semibold border-b"
                          style={{
                            borderColor: theme.borderPrimary,
                            color: theme.textSecondary,
                          }}
                        >
                          {t.regionMenuTitle}
                        </div>
                        {(['CN', 'US', 'EU', 'JP'] as GeoRegionCode[]).map(
                          (regCode) => (
                            <button
                              key={regCode}
                              type="button"
                              onClick={() => {
                                setRegion(regCode);
                                setShowRegionMenu(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors"
                              style={{
                                backgroundColor:
                                  region === regCode
                                    ? `${theme.accentHex}22`
                                    : 'transparent',
                              }}
                            >
                              <span>{t.regionName[regCode]}</span>
                              <span
                                className="w-3 h-3 rounded-full border shrink-0"
                                style={{
                                  backgroundColor:
                                    REGIONAL_THEMES[regCode][colorMode]
                                      .accentHex,
                                  borderColor: theme.borderPrimary,
                                }}
                              />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Day / Night (Light / Dark) Mode Toggle for EVERY Region! */}
                  <button
                    id="color-mode-toggle-btn"
                    type="button"
                    onClick={() =>
                      setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))
                    }
                    className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border flex items-center gap-1 transition-all"
                    style={{
                      backgroundColor: theme.bgSubtle,
                      borderColor: theme.borderPrimary,
                      color: theme.textPrimary,
                    }}
                    title={
                      colorMode === 'dark' ? t.switchToLight : t.switchToDark
                    }
                  >
                    {colorMode === 'dark' ? (
                      <>
                        <Sun
                          className="w-3 h-3"
                          style={{ color: theme.warnHex }}
                        />
                        <span>{t.modeLight}</span>
                      </>
                    ) : (
                      <>
                        <Moon
                          className="w-3 h-3"
                          style={{ color: theme.secondaryHex }}
                        />
                        <span>{t.modeDark}</span>
                      </>
                    )}
                  </button>
                </div>
                <p
                  className="text-[10px] hidden md:block"
                  style={{ color: theme.textSecondary }}
                >
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {activeTool === 'tuner' && (
                <button
                  type="button"
                  onClick={() => setDeepNoiseSuppression((v) => !v)}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: deepNoiseSuppression
                      ? `${theme.accentHex}22`
                      : theme.bgCard,
                    borderColor: deepNoiseSuppression
                      ? theme.accentHex
                      : theme.borderPrimary,
                    color: deepNoiseSuppression
                      ? theme.accentHex
                      : theme.textSecondary,
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {deepNoiseSuppression
                      ? t.noiseReductionOn
                      : t.noiseReductionOff}
                  </span>
                </button>
              )}

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
                      if (tunerMode === 'sound-it') setTunerMode('tune-manual');
                      setIsSimulating(true);
                    }
                  }}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: isSimulating
                      ? `${theme.warnHex}22`
                      : theme.bgCard,
                    borderColor: isSimulating
                      ? theme.warnHex
                      : theme.borderPrimary,
                    color: isSimulating ? theme.warnHex : theme.textSecondary,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isSimulating ? t.simOn : t.simOff}
                  </span>
                </button>
              )}

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
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all"
                  style={{
                    backgroundColor: isMicListening
                      ? theme.accentHex
                      : `${theme.accentHex}22`,
                    borderColor: theme.accentHex,
                    color: isMicListening ? '#ffffff' : theme.accentHex,
                  }}
                >
                  {isMicListening ? (
                    <>
                      <Mic className="w-3.5 h-3.5 animate-pulse" />
                      <span>{t.micOn}</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>{t.micOff}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl border transition-colors"
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.borderPrimary,
                  color: theme.textPrimary,
                }}
                aria-label={t.settingsTitle}
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: 5-in-1 Music Tool Suite Switcher Tabs */}
          <nav
            aria-label={t.tabTuner}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5"
          >
            {[
              { id: 'tuner', label: t.tabTuner, icon: Gauge },
              { id: 'metronome', label: t.tabMetronome, icon: Timer },
              { id: 'chords', label: t.tabChords, icon: Guitar },
              { id: 'ear-trainer', label: t.tabEar, icon: Headphones },
              { id: 'decibel', label: t.tabDecibel, icon: BarChart3 },
            ].map((tab) => {
              const IconComp = tab.icon;
              const active = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTool(tab.id as ActiveToolTab)}
                  className="shrink-0 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all"
                  style={{
                    backgroundColor: active ? theme.accentHex : theme.bgCard,
                    borderColor: active ? theme.accentHex : theme.borderPrimary,
                    color: active ? '#ffffff' : theme.textSecondary,
                  }}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Responsive Workbench Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-2 sm:py-3 flex flex-col justify-between gap-2.5">
        {activeTool === 'tuner' && (
          <>
            {/* Smart Noisy Environment Alert Banner */}
            {isMicListening &&
              isNoisyEnvironment &&
              !deepNoiseSuppression &&
              !noiseAlertDismissed && (
                <div
                  className="rounded-xl border px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md"
                  style={{
                    backgroundColor: `${theme.warnHex}20`,
                    borderColor: theme.warnHex,
                    color: theme.textPrimary,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className="w-4 h-4 shrink-0"
                      style={{ color: theme.warnHex }}
                    />
                    <span>
                      <strong>{t.noisyAlertTitle}</strong>
                      {t.noisyAlertDesc}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeepNoiseSuppression(true)}
                      className="px-3 py-1 rounded-lg text-white font-bold transition-colors"
                      style={{ backgroundColor: theme.warnHex }}
                    >
                      {t.noisyAlertBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoiseAlertDismissed(true)}
                      className="px-1.5"
                      style={{ color: theme.textSecondary }}
                    >
                      {t.ignoreBtn}
                    </button>
                  </div>
                </div>
              )}

            {micError && (
              <div
                className="rounded-xl border px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2"
                style={{
                  backgroundColor: `${theme.dangerHex}20`,
                  borderColor: theme.dangerHex,
                  color: theme.dangerHex,
                }}
              >
                <div className="space-y-0.5">
                  <div className="font-bold">{t.micModalErrorTitle}</div>
                  <div className="opacity-90">{t.micModalErrorSteps}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startMicrophone()}
                    className="px-3 py-1 rounded-lg font-bold text-white"
                    style={{ backgroundColor: theme.dangerHex }}
                  >
                    {t.micModalRetryBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicError(null)}
                    className="px-1.5 font-semibold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {!isMicListening &&
              !isSimulating &&
              tunerMode !== 'sound-it' &&
              !micError && (
                <div
                  className="rounded-xl border px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2"
                  style={{
                    backgroundColor: `${theme.accentHex}16`,
                    borderColor: `${theme.accentHex}66`,
                    color: theme.textPrimary,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Mic
                      className="w-4 h-4 shrink-0 animate-pulse"
                      style={{ color: theme.accentHex }}
                    />
                    <span>{t.micBannerPrompt}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMicModalOpen(true)}
                    className="px-3 py-1 rounded-lg font-bold text-white shrink-0 transition-opacity hover:opacity-95"
                    style={{ backgroundColor: theme.accentHex }}
                  >
                    {t.micBannerBtn}
                  </button>
                </div>
              )}

            {/*
              Responsive Layout:
              - On Mobile (<1024px): String Selector Panel is FIRST (order-1) right at the top of the first screen,
                followed immediately by the Dial Meter (order-2), so BOTH fit 100% inside the first screen (<667px)!
              - On Desktop (>=1024px): 12-col side-by-side Workbench (Left 7 cols: Dial + Tape + Modes | Right 5 cols: String Selector)
            */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 items-start">
              {/* String Selector Panel: order-1 on mobile (visible immediately at top of first screen!), order-2 on desktop */}
              <div className="order-1 lg:order-2 lg:col-span-5">
                <InstrumentStringsPanel
                  selectedPreset={selectedPreset}
                  selectedTuning={selectedTuning}
                  targetMidi={targetMidi}
                  a4Hz={a4Hz}
                  temperament={temperament}
                  isManualLocked={tunerMode === 'tune-manual'}
                  autoAdvanceNextString={autoAdvanceNextString}
                  tunedStrings={tunedStrings}
                  theme={theme}
                  lang={lang}
                  onSelectPreset={handleSelectPreset}
                  onSelectTuning={handleSelectTuning}
                  onSelectString={handleSelectString}
                  onToggleAutoAdvance={() => setAutoAdvanceNextString((v) => !v)}
                  onResetTunedStrings={() => {
                    setTunedStrings(new Set());
                    holdProgressRef.current = {
                      midi: targetMidi,
                      progress: 0,
                      chimed: false,
                    };
                    setHoldProgress(0);
                  }}
                />
              </div>

              {/* Dial Meter + Scrolling Tape + Mode Buttons: order-2 on mobile (also inside first screen!), order-1 on desktop */}
              <div className="order-2 lg:order-1 lg:col-span-7 space-y-2.5 sm:space-y-3">
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
                    matchedString ? matchedString.label[lang] : null
                  }
                  activeTimbreLabel={activeTimbreLabel}
                  isManualLocked={tunerMode === 'tune-manual'}
                  isSoundItMode={tunerMode === 'sound-it'}
                  holdProgress={holdProgress}
                  isCurrentStringTuned={tunedStrings.has(targetMidi)}
                  theme={theme}
                  lang={lang}
                />

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
                  theme={theme}
                  lang={lang}
                />

                {/* 3-Button Mode Bar */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTunerMode('tune-manual');
                      if (!isMicListening && !isSimulating) {
                        startMicrophone();
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all"
                    style={{
                      backgroundColor:
                        tunerMode === 'tune-manual'
                          ? `${theme.accentHex}24`
                          : theme.bgCard,
                      borderColor:
                        tunerMode === 'tune-manual'
                          ? theme.accentHex
                          : theme.borderPrimary,
                      color:
                        tunerMode === 'tune-manual'
                          ? theme.accentHex
                          : theme.textSecondary,
                    }}
                  >
                    <Crosshair className="w-4 h-4 shrink-0" />
                    <div className="text-center sm:text-left">
                      <div>{t.modeManualTitle}</div>
                      <div className="text-[10px] font-normal opacity-80">
                        {t.modeManualSub}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTunerMode('tune-auto');
                      if (!isMicListening && !isSimulating) {
                        startMicrophone();
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all"
                    style={{
                      backgroundColor:
                        tunerMode === 'tune-auto'
                          ? `${theme.secondaryHex}24`
                          : theme.bgCard,
                      borderColor:
                        tunerMode === 'tune-auto'
                          ? theme.secondaryHex
                          : theme.borderPrimary,
                      color:
                        tunerMode === 'tune-auto'
                          ? theme.secondaryHex
                          : theme.textSecondary,
                    }}
                  >
                    <Wand2 className="w-4 h-4 shrink-0" />
                    <div className="text-center sm:text-left">
                      <div>{t.modeAutoTitle}</div>
                      <div className="text-[10px] font-normal opacity-80">
                        {t.modeAutoSub}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (tunerMode === 'sound-it') {
                        setTunerMode('tune-manual');
                      } else {
                        setTunerMode('sound-it');
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all"
                    style={{
                      backgroundColor:
                        tunerMode === 'sound-it'
                          ? `${theme.warnHex}24`
                          : theme.bgCard,
                      borderColor:
                        tunerMode === 'sound-it'
                          ? theme.warnHex
                          : theme.borderPrimary,
                      color:
                        tunerMode === 'sound-it'
                          ? theme.warnHex
                          : theme.textSecondary,
                    }}
                  >
                    {tunerMode === 'sound-it' ? (
                      <Volume2 className="w-4 h-4 shrink-0 animate-bounce" />
                    ) : (
                      <VolumeX className="w-4 h-4 shrink-0" />
                    )}
                    <div className="text-center sm:text-left">
                      <div>{t.modeSoundTitle}</div>
                      <div className="text-[10px] font-normal opacity-80">
                        {t.modeSoundSub}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTool === 'metronome' && (
          <MetronomeTool theme={theme} lang={lang} />
        )}
        {activeTool === 'chords' && (
          <ChordLibraryTool a4Hz={a4Hz} theme={theme} lang={lang} />
        )}
        {activeTool === 'ear-trainer' && (
          <EarTrainerTool a4Hz={a4Hz} theme={theme} lang={lang} />
        )}
        {activeTool === 'decibel' && (
          <DecibelMeterTool theme={theme} lang={lang} />
        )}
      </main>

      {/* SEO Structured Guide, Tuning Reference Table, FAQ & Compliance Footer */}
      <SeoKnowledgeFooter theme={theme} lang={lang} />

      {/* Microphone / Recording Permission Prompt Modal (Localized to Page Language) */}
      <MicPermissionModal
        isOpen={isMicModalOpen}
        hasError={Boolean(micError)}
        errorDetail={micError}
        theme={theme}
        lang={lang}
        region={region}
        onChangeRegion={(reg) => setRegion(reg)}
        onAllowMic={() => {
          startMicrophone();
        }}
        onUseReferenceTone={() => {
          setMicError(null);
          setIsMicModalOpen(false);
          setTunerMode('sound-it');
        }}
        onClose={() => {
          setIsMicModalOpen(false);
        }}
      />

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
        theme={theme}
        lang={lang}
      />
    </div>
  );
};

export default App;
