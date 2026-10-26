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
  THEME_PALETTES,
  ThemePaletteId,
  SupportedLang,
  UI_TRANSLATIONS,
  detectUserGeoAndTheme,
} from './i18n/localeTheme';
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
  Globe,
  Palette,
} from 'lucide-react';

type ActiveToolTab = 'tuner' | 'metronome' | 'chords' | 'ear-trainer' | 'decibel';

export const App: React.FC = () => {
  // Multi-Tool Navigation State
  const [activeTool, setActiveTool] = useState<ActiveToolTab>('tuner');

  // IP Geolocation -> Language & Theme Palette State
  const [lang, setLang] = useState<SupportedLang>('zh');
  const [paletteId, setPaletteId] = useState<ThemePaletteId>('emerald-cn');
  const [geoLabel, setGeoLabel] = useState<string>('IP: CN · 翡翠主题');
  const [showRegionMenu, setShowRegionMenu] = useState<boolean>(false);

  const theme = THEME_PALETTES[paletteId];
  const t = UI_TRANSLATIONS[lang];

  // Auto-detect IP Country -> Language & Theme on mount (also supports ?region=US/CN/EU/JP/LIGHT URL query for testing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forcedRegion = params.get('region')?.toUpperCase();
    if (forcedRegion === 'US') {
      setLang('en');
      setPaletteId('cobalt-us');
      setGeoLabel('IP: US · Cobalt Pro');
      return;
    }
    if (forcedRegion === 'EU') {
      setLang('en');
      setPaletteId('amber-eu');
      setGeoLabel('IP: EU · Warm Amber');
      return;
    }
    if (forcedRegion === 'JP') {
      setLang('ja');
      setPaletteId('violet-jp');
      setGeoLabel('IP: JP · Neon Violet');
      return;
    }
    if (forcedRegion === 'LIGHT') {
      setLang('zh');
      setPaletteId('light-studio');
      setGeoLabel('Daylight · 浅色护眼');
      return;
    }

    detectUserGeoAndTheme().then((info) => {
      setLang(info.lang);
      setPaletteId(info.paletteId);
      setGeoLabel(
        `IP: ${info.countryCode}${info.ip ? ` (${info.ip})` : ''} · ${
          THEME_PALETTES[info.paletteId].regionBadge
        }`
      );
    });
  }, []);

  // Instrument & Tuning State
  const [selectedPreset, setSelectedPreset] = useState<InstrumentPreset>(
    INSTRUMENT_PRESETS[1] // Guitar Standard
  );
  const [selectedTuning, setSelectedTuning] = useState<TuningVariant>(
    INSTRUMENT_PRESETS[1].tunings[0]
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
  const [targetMidi, setTargetMidi] = useState<number>(40); // Default Guitar 6th string E2
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
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
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
    return found ? found.name.split(' ')[0] : '原声建模';
  }, [resolvedTimbre]);

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

    // Dynamically adjust hardware bandpass filter cutoffs to focus on the selected string
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
        // Gentle decay of hold progress when silent
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

          // Strong hysteresis (+30 cents) so it doesn't flip-flop between strings
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

      // Hold-in-Small-Fluctuation-Zone (±5.5 cents) Timer & Chime!
      if (holdProgressRef.current.midi !== chosenMidi) {
        holdProgressRef.current = { midi: chosenMidi, progress: 0, chimed: false };
      }

      if (Math.abs(rawCents) <= 5.5 && phase !== 'attack') {
        // Inside ±5.5 cents small fluctuation window: accumulate progress (~0.85s to reach 100%)
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
              // Optional auto-advance to next untuned string after 1.3s
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
        // Forgiving decay if pitch momentarily drifts slightly outside ±5.5 cents
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
        err instanceof Error
          ? err.message
          : '无法访问麦克风，请检查浏览器麦克风权限设置';
      setMicError(
        `麦克风启动失败：${message}（您仍可使用「模拟调弦」或「Sound It 原声耳调」功能）`
      );
      setIsMicListening(false);
    }
  }, [processDetectedPitch, tunerMode]);

  useEffect(() => {
    if (activeTool !== 'tuner') {
      if (isMicListening) stopMicrophone();
      setIsSimulating(false);
      toneGenRef.current.stopContinuous();
    }
  }, [activeTool, isMicListening, stopMicrophone]);

  // Interactive Simulation Mode (demonstrates String Selection -> Smooth Glide into ±5¢ Zone -> Hold -> Chime!)
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
        // Smoothly turning tuning peg from -16 cents into the ±5¢ zone
        const progress = cycle / 0.35;
        simCents = -16 * (1 - progress) + Math.sin(simFrame * 0.08) * 0.4;
      } else if (cycle < 0.88) {
        // Holding steadily inside ±2 cents small fluctuation window -> triggers Hold Progress 0..100% and Chime!
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

  // Clicking a string locks onto that string first (Requirement 1!)
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
        className="sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-6 pt-2.5 pb-2 transition-colors duration-300"
        style={{
          backgroundColor: theme.bgHeader,
          borderColor: theme.borderPrimary,
        }}
      >
        <div className="max-w-7xl mx-auto space-y-2">
          {/* Row 1: Brand, IP Region/Theme Switcher & Quick Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center"
                style={{
                  backgroundColor: `${theme.accentHex}20`,
                  borderColor: `${theme.accentHex}66`,
                }}
              >
                <Radio className="w-4 h-4" style={{ color: theme.accentHex }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight">
                    TuneKit{' '}
                    <span className="font-mono" style={{ color: theme.accentHex }}>
                      Pro
                    </span>
                  </h1>

                  {/* IP Region & Theme/Language Selector Pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRegionMenu((v) => !v)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all"
                      style={{
                        backgroundColor: `${theme.secondaryHex}18`,
                        borderColor: `${theme.secondaryHex}55`,
                        color: theme.secondaryHex,
                      }}
                      title="根据您的 IP 自动匹配语言与主题配色，点击可手动切换预览"
                    >
                      <Globe className="w-3 h-3" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {geoLabel}
                      </span>
                      <Palette className="w-3 h-3 ml-0.5" />
                    </button>

                    {showRegionMenu && (
                      <div
                        className="absolute left-0 mt-1.5 w-64 rounded-xl border p-2 shadow-2xl z-50 space-y-1 text-xs"
                        style={{
                          backgroundColor: theme.bgCard,
                          borderColor: theme.borderPrimary,
                          color: theme.textPrimary,
                        }}
                      >
                        <div className="px-2 py-1 text-[10px] text-slate-400 font-semibold border-b border-slate-800/60">
                          IP 区域主题与多语言切换 (Auto-IP & Manual)
                        </div>
                        {[
                          {
                            pid: 'emerald-cn' as ThemePaletteId,
                            l: 'zh' as SupportedLang,
                            label: '🇨🇳 CN 华语区 · 东方翡翠暗黑 (中文)',
                          },
                          {
                            pid: 'cobalt-us' as ThemePaletteId,
                            l: 'en' as SupportedLang,
                            label: '🇺🇸 US 北美区 · 深空电光蓝 (English)',
                          },
                          {
                            pid: 'amber-eu' as ThemePaletteId,
                            l: 'en' as SupportedLang,
                            label: '🇪🇺 EU 欧洲区 · 复古电子管暖金 (English)',
                          },
                          {
                            pid: 'violet-jp' as ThemePaletteId,
                            l: 'ja' as SupportedLang,
                            label: '🇯🇵 JP 日韩区 · 东京极夜紫晶 (日本語)',
                          },
                          {
                            pid: 'light-studio' as ThemePaletteId,
                            l: lang,
                            label: '☀️ Daylight · 日间护眼浅色模式',
                          },
                        ].map((opt) => (
                          <button
                            key={opt.pid}
                            type="button"
                            onClick={() => {
                              setPaletteId(opt.pid);
                              setLang(opt.l);
                              setGeoLabel(THEME_PALETTES[opt.pid].regionBadge);
                              setShowRegionMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800/40 flex items-center justify-between"
                            style={{
                              backgroundColor:
                                paletteId === opt.pid
                                  ? `${theme.accentHex}22`
                                  : 'transparent',
                            }}
                          >
                            <span>{opt.label}</span>
                            <span
                              className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                              style={{
                                backgroundColor: THEME_PALETTES[opt.pid].accentHex,
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5">
              {activeTool === 'tuner' && (
                <button
                  type="button"
                  onClick={() => setDeepNoiseSuppression((v) => !v)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all"
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
                  <span>
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
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all"
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
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-all"
                  style={{
                    backgroundColor: isMicListening
                      ? theme.accentHex
                      : `${theme.accentHex}22`,
                    borderColor: theme.accentHex,
                    color: isMicListening ? '#022c22' : theme.accentHex,
                  }}
                >
                  {isMicListening ? (
                    <>
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>{t.micOn}</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>{t.micOff}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl border transition-colors"
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.borderPrimary,
                  color: theme.textPrimary,
                }}
                title="Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: 5-in-1 Music Tool Suite Switcher Tabs */}
          <nav
            aria-label="Music Tools Navigation"
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
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all"
                  style={{
                    backgroundColor: active ? theme.accentHex : theme.bgCard,
                    borderColor: active ? theme.accentHex : theme.borderPrimary,
                    color: active ? '#022c22' : theme.textSecondary,
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

      {/* Main Responsive Workbench Content Container (max-w-7xl with 12-col Desktop Workbench!) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 flex flex-col justify-between gap-3">
        {activeTool === 'tuner' && (
          <>
            {/* Smart Noisy Environment Alert Banner */}
            {isMicListening &&
              isNoisyEnvironment &&
              !deepNoiseSuppression &&
              !noiseAlertDismissed && (
                <div className="rounded-xl bg-amber-950/80 border border-amber-500/50 px-3.5 py-2.5 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>{t.noisyAlertTitle}</strong>
                      {t.noisyAlertDesc}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeepNoiseSuppression(true)}
                      className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors"
                    >
                      {t.noisyAlertBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoiseAlertDismissed(true)}
                      className="text-amber-300 hover:text-white px-1.5"
                    >
                      {t.ignoreBtn}
                    </button>
                  </div>
                </div>
              )}

            {micError && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-500/40 px-3.5 py-2 text-xs text-rose-200 flex items-center justify-between gap-2">
                <span>{micError}</span>
                <button
                  type="button"
                  onClick={() => setMicError(null)}
                  className="text-rose-400 hover:text-white shrink-0 font-semibold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Responsive Desktop 2-Column Workbench (Left 7 cols: Dial + Tape + Modes | Right 5 cols: Instrument String Selector) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column (7/12 on Desktop): Analog Dial Meter + Scrolling Tape + Mode Buttons */}
              <div className="lg:col-span-7 space-y-3">
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
                />

                {/* 3-Button Mode Bar (Defaulting to String-First Manual Selection!) */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Mode 1 (Recommended): Select String First -> Tune */}
                  <button
                    type="button"
                    onClick={() => {
                      setTunerMode('tune-manual');
                      if (!isMicListening && !isSimulating) {
                        startMicrophone();
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all"
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

                  {/* Mode 2: Auto Detect */}
                  <button
                    type="button"
                    onClick={() => {
                      setTunerMode('tune-auto');
                      if (!isMicListening && !isSimulating) {
                        startMicrophone();
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all"
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

                  {/* Mode 3: Sound It Reference Tone */}
                  <button
                    type="button"
                    onClick={() => {
                      if (tunerMode === 'sound-it') {
                        setTunerMode('tune-manual');
                      } else {
                        setTunerMode('sound-it');
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all"
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

              {/* Right Column (5/12 on Desktop): Step 1 Instrument & String Selector Panel */}
              <div className="lg:col-span-5">
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
            </div>
          </>
        )}

        {activeTool === 'metronome' && <MetronomeTool />}
        {activeTool === 'chords' && <ChordLibraryTool a4Hz={a4Hz} />}
        {activeTool === 'ear-trainer' && <EarTrainerTool a4Hz={a4Hz} />}
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
