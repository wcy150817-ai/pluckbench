import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemePalette, SupportedLang } from '../i18n/localeTheme';
import { Play, Square, Plus, Minus, Hand, Volume2 } from 'lucide-react';

type ClickSoundType = 'woodblock' | 'mechanical' | 'studio' | 'hihat';
type BeatLevel = 3 | 2 | 1 | 0;

const TEMPO_MARKS: {
  min: number;
  max: number;
  label: Record<SupportedLang, string>;
}[] = [
  {
    min: 30,
    max: 59,
    label: {
      zh: '广板 · 极缓庄重',
      en: 'Largo · Broad & Slow',
      ja: 'ラルゴ · 極めて遅く',
    },
  },
  {
    min: 60,
    max: 75,
    label: {
      zh: '柔板 · 抒情从容',
      en: 'Adagio · Slow & Expressive',
      ja: 'アダージョ · ゆるやかに',
    },
  },
  {
    min: 76,
    max: 107,
    label: {
      zh: '行板 · 漫步节奏',
      en: 'Andante · Walking Pace',
      ja: 'アンダンテ · 歩くような速さで',
    },
  },
  {
    min: 108,
    max: 119,
    label: {
      zh: '中板 · 稳健均衡',
      en: 'Moderato · Moderate Tempo',
      ja: 'モデラート · 中くらいの速さで',
    },
  },
  {
    min: 120,
    max: 155,
    label: {
      zh: '快板 · 明快活力',
      en: 'Allegro · Fast & Bright',
      ja: 'アレグロ · 速く快活に',
    },
  },
  {
    min: 156,
    max: 260,
    label: {
      zh: '急板 · 极速炫技',
      en: 'Presto · Very Fast',
      ja: 'プレスト · 極めて速く',
    },
  },
];

const METRONOME_TEXT: Record<
  SupportedLang,
  {
    bpmUnit: string;
    tapBtn: string;
    accentHint: string;
    beatPrefix: (n: number) => string;
    lvl3: string;
    lvl2: string;
    lvl1: string;
    lvl0: string;
    timeSigLabel: string;
    subdivLabel: string;
    sub1: string;
    sub2: string;
    sub3: string;
    sub4: string;
    soundLabel: string;
    woodblock: string;
    mechanical: string;
    studio: string;
    hihat: string;
    startBtn: string;
    stopBtn: string;
  }
> = {
  zh: {
    bpmUnit: '拍/分钟 (BPM)',
    tapBtn: '点击测速',
    accentHint: '节拍强弱矩阵（点击任意拍可切换：强拍 / 次强拍 / 弱拍 / 静音）',
    beatPrefix: (n) => `第 ${n} 拍`,
    lvl3: '强拍',
    lvl2: '次强拍',
    lvl1: '普通拍',
    lvl0: '静音',
    timeSigLabel: '拍号 (每小节拍数)',
    subdivLabel: '节奏细分',
    sub1: '♩ 一拍',
    sub2: '♪♪ 二分',
    sub3: '3 三连音',
    sub4: '♬ 十六分',
    soundLabel: '节拍器音色',
    woodblock: '红木木鱼',
    mechanical: '机械钟摆',
    studio: '录音棚点击',
    hihat: '架子鼓踩镲',
    startBtn: '启动节拍器',
    stopBtn: '停止节拍器',
  },
  en: {
    bpmUnit: 'BPM (Beats / Min)',
    tapBtn: 'Tap Tempo',
    accentHint: 'Beat Accent Matrix (Tap any beat to cycle: Accent / Medium / Normal / Mute)',
    beatPrefix: (n) => `Beat ${n}`,
    lvl3: 'Accent',
    lvl2: 'Medium',
    lvl1: 'Normal',
    lvl0: 'Mute',
    timeSigLabel: 'Time Signature',
    subdivLabel: 'Subdivision',
    sub1: '♩ Quarter',
    sub2: '♪♪ Eighth',
    sub3: '3 Triplet',
    sub4: '♬ Sixteenth',
    soundLabel: 'Click Sound',
    woodblock: 'Woodblock',
    mechanical: 'Pendulum',
    studio: 'Studio Click',
    hihat: 'Hi-Hat',
    startBtn: 'START METRONOME',
    stopBtn: 'STOP METRONOME',
  },
  ja: {
    bpmUnit: 'BPM (拍/分)',
    tapBtn: 'タップテンポ',
    accentHint: 'アクセント設定（各拍をタップして強拍・中強拍・弱拍・消音を切替）',
    beatPrefix: (n) => `${n} 拍目`,
    lvl3: '強拍',
    lvl2: '中強拍',
    lvl1: '弱拍',
    lvl0: 'ミュート',
    timeSigLabel: '拍子記号',
    subdivLabel: 'リズム分割',
    sub1: '♩ 4分音符',
    sub2: '♪♪ 8分音符',
    sub3: '3 3連符',
    sub4: '♬ 16分音符',
    soundLabel: 'クリック音色',
    woodblock: 'ウッドブロック',
    mechanical: '振り子時計',
    studio: 'スタジオ電子音',
    hihat: 'ハイハット',
    startBtn: 'メトロノーム開始',
    stopBtn: 'メトロノーム停止',
  },
};

export const MetronomeTool: React.FC<{
  theme: ThemePalette;
  lang: SupportedLang;
}> = ({ theme, lang }) => {
  const txt = METRONOME_TEXT[lang];
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beatsPerBar, setBeatsPerBar] = useState<number>(4);
  const [subdivision, setSubdivision] = useState<number>(1);
  const [soundType, setSoundType] = useState<ClickSoundType>('woodblock');
  const [volume] = useState<number>(0.8);
  const [beatLevels, setBeatLevels] = useState<BeatLevel[]>([3, 1, 2, 1]);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(-1);
  const [, setTapTimes] = useState<number[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentSubStepRef = useRef<number>(0);

  const paramsRef = useRef({
    bpm,
    beatsPerBar,
    subdivision,
    soundType,
    volume,
    beatLevels,
  });

  useEffect(() => {
    paramsRef.current = {
      bpm,
      beatsPerBar,
      subdivision,
      soundType,
      volume,
      beatLevels,
    };
  }, [bpm, beatsPerBar, subdivision, soundType, volume, beatLevels]);

  const handleChangeBeatsPerBar = (count: number) => {
    setBeatsPerBar(count);
    const next: BeatLevel[] = [];
    for (let i = 0; i < count; i++) {
      next.push(i === 0 ? 3 : count === 6 && i === 3 ? 2 : 1);
    }
    setBeatLevels(next);
  };

  const toggleBeatLevel = (idx: number) => {
    setBeatLevels((prev) => {
      const next = [...prev];
      const cur = next[idx];
      next[idx] = cur === 3 ? 2 : cur === 2 ? 1 : cur === 1 ? 0 : 3;
      return next;
    });
  };

  const playScheduledClick = useCallback(
    (time: number, level: BeatLevel, isSubBeat: boolean) => {
      const ctx = audioCtxRef.current;
      if (!ctx || level === 0) return;

      const { soundType: st, volume: vol } = paramsRef.current;
      const gainMult =
        isSubBeat ? 0.32 : level === 3 ? 1.0 : level === 2 ? 0.72 : 0.52;
      const peakGain = Math.max(0.01, vol * gainMult * 0.65);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(peakGain, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.055);

      if (st === 'hihat') {
        const bufSize = Math.floor(ctx.sampleRate * 0.05);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(level === 3 ? 5200 : 7000, time);
        src.connect(hp);
        hp.connect(gain);
        gain.connect(ctx.destination);
        src.start(time);
        return;
      }

      const osc = ctx.createOscillator();
      if (st === 'woodblock') {
        osc.type = 'triangle';
        const baseFreq = isSubBeat ? 620 : level === 3 ? 1120 : level === 2 ? 880 : 760;
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.68, time + 0.045);
      } else if (st === 'mechanical') {
        osc.type = 'square';
        const baseFreq = isSubBeat ? 900 : level === 3 ? 1650 : 1200;
        osc.frequency.setValueAtTime(baseFreq, time);
        osc.frequency.exponentialRampToValueAtTime(280, time + 0.028);
      } else {
        osc.type = 'sine';
        const baseFreq = isSubBeat ? 880 : level === 3 ? 1760 : 1174.66;
        osc.frequency.setValueAtTime(baseFreq, time);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.06);
    },
    []
  );

  useEffect(() => {
    if (!isPlaying) {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      setActiveBeatIndex(-1);
      return;
    }

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    currentSubStepRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.04;

    const scheduler = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
        const {
          bpm: curBpm,
          beatsPerBar: curBeats,
          subdivision: curSub,
          beatLevels: curLevels,
        } = paramsRef.current;

        const totalSubSteps = curBeats * curSub;
        const step = currentSubStepRef.current % totalSubSteps;
        const beatIdx = Math.floor(step / curSub);
        const isSubBeat = step % curSub !== 0;
        const beatLevel = curLevels[beatIdx] ?? 1;

        playScheduledClick(nextNoteTimeRef.current, beatLevel, isSubBeat);

        if (!isSubBeat) {
          const delayMs = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
          window.setTimeout(() => {
            setActiveBeatIndex(beatIdx);
          }, delayMs);
        }

        const secondsPerBeat = 60.0 / curBpm;
        nextNoteTimeRef.current += secondsPerBeat / curSub;
        currentSubStepRef.current = (step + 1) % totalSubSteps;
      }
    };

    timerIdRef.current = window.setInterval(scheduler, 25);
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isPlaying, playScheduledClick]);

  const handleTapTempo = () => {
    const now = performance.now();
    setTapTimes((prev) => {
      const recent = prev.filter((t) => now - t < 3000);
      const updated = [...recent, now];
      if (updated.length >= 2) {
        let sumIntervals = 0;
        for (let i = 1; i < updated.length; i++) {
          sumIntervals += updated[i] - updated[i - 1];
        }
        const avgMs = sumIntervals / (updated.length - 1);
        const calculatedBpm = Math.round(60000 / avgMs);
        if (calculatedBpm >= 30 && calculatedBpm <= 260) {
          setBpm(calculatedBpm);
        }
      }
      return updated.slice(-6);
    });
  };

  const tempoMark =
    TEMPO_MARKS.find((m) => bpm >= m.min && bpm <= m.max) || TEMPO_MARKS[4];

  return (
    <div className="w-full space-y-4">
      <div
        className="rounded-2xl border p-4 sm:p-6 shadow-xl space-y-5 transition-colors duration-300"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
          color: theme.textPrimary,
        }}
      >
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4"
          style={{ borderColor: theme.borderPrimary }}
        >
          <div className="text-center sm:text-left">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{
                backgroundColor: `${theme.accentHex}20`,
                color: theme.accentHex,
                borderColor: `${theme.accentHex}44`,
              }}
            >
              {tempoMark.label[lang]}
            </span>
            <div className="mt-2 flex items-baseline justify-center sm:justify-start gap-2">
              <span className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight">
                {bpm}
              </span>
              <span
                className="text-sm font-mono"
                style={{ color: theme.textSecondary }}
              >
                {txt.bpmUnit}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBpm((b) => Math.max(30, b - 5))}
              className="px-2.5 py-2 rounded-xl border text-xs font-mono"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.max(30, b - 1))}
              className="p-2.5 rounded-xl border"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.min(260, b + 1))}
              className="p-2.5 rounded-xl border"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.min(260, b + 5))}
              className="px-2.5 py-2 rounded-xl border text-xs font-mono"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              +5
            </button>
            <button
              type="button"
              onClick={handleTapTempo}
              className="px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: `${theme.secondaryHex}20`,
                color: theme.secondaryHex,
                borderColor: `${theme.secondaryHex}55`,
              }}
            >
              <Hand className="w-4 h-4" />
              <span>{txt.tapBtn}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={30}
            max={260}
            step={1}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full cursor-pointer"
          />
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {[60, 72, 80, 90, 100, 110, 120, 132, 144, 160, 180].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBpm(preset)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors"
                style={{
                  backgroundColor:
                    bpm === preset ? `${theme.accentHex}22` : theme.bgSubtle,
                  borderColor:
                    bpm === preset ? theme.accentHex : theme.borderPrimary,
                  color: bpm === preset ? theme.accentHex : theme.textSecondary,
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div
            className="flex items-center justify-between text-xs"
            style={{ color: theme.textSecondary }}
          >
            <span>{txt.accentHint}</span>
            <span className="font-mono" style={{ color: theme.accentHex }}>
              {beatsPerBar}/4
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {beatLevels.map((lvl, idx) => {
              const isCurrent = isPlaying && activeBeatIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleBeatLevel(idx)}
                  className="relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all"
                  style={{
                    backgroundColor: isCurrent
                      ? `${theme.accentHex}30`
                      : theme.bgSubtle,
                    borderColor: isCurrent
                      ? theme.accentHex
                      : theme.borderPrimary,
                  }}
                >
                  <span
                    className="text-xs font-mono"
                    style={{ color: theme.textSecondary }}
                  >
                    {txt.beatPrefix(idx + 1)}
                  </span>
                  <div className="flex items-end gap-1 h-8 my-1.5">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={`w-2.5 rounded-sm transition-all ${
                          bar === 1 ? 'h-3' : bar === 2 ? 'h-5' : 'h-8'
                        }`}
                        style={{
                          backgroundColor:
                            lvl >= bar
                              ? lvl === 3
                                ? theme.accentHex
                                : lvl === 2
                                ? theme.warnHex
                                : theme.secondaryHex
                              : theme.borderPrimary,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium">
                    {lvl === 3
                      ? txt.lvl3
                      : lvl === 2
                      ? txt.lvl2
                      : lvl === 1
                      ? txt.lvl1
                      : txt.lvl0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t"
          style={{ borderColor: theme.borderPrimary }}
        >
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold block"
              style={{ color: theme.textSecondary }}
            >
              {txt.timeSigLabel}
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[2, 3, 4, 5, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleChangeBeatsPerBar(cnt)}
                  className="py-1.5 rounded-lg text-xs font-mono font-semibold border"
                  style={{
                    backgroundColor:
                      beatsPerBar === cnt
                        ? `${theme.accentHex}22`
                        : theme.bgSubtle,
                    borderColor:
                      beatsPerBar === cnt
                        ? theme.accentHex
                        : theme.borderPrimary,
                    color:
                      beatsPerBar === cnt
                        ? theme.accentHex
                        : theme.textSecondary,
                  }}
                >
                  {cnt}/4
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold block"
              style={{ color: theme.textSecondary }}
            >
              {txt.subdivLabel}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { sub: 1, label: txt.sub1 },
                { sub: 2, label: txt.sub2 },
                { sub: 3, label: txt.sub3 },
                { sub: 4, label: txt.sub4 },
              ].map((item) => (
                <button
                  key={item.sub}
                  type="button"
                  onClick={() => setSubdivision(item.sub)}
                  className="py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor:
                      subdivision === item.sub
                        ? `${theme.secondaryHex}22`
                        : theme.bgSubtle,
                    borderColor:
                      subdivision === item.sub
                        ? theme.secondaryHex
                        : theme.borderPrimary,
                    color:
                      subdivision === item.sub
                        ? theme.secondaryHex
                        : theme.textSecondary,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: theme.textSecondary }}
            >
              <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accentHex }} />
              <span>{txt.soundLabel}</span>
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'woodblock', label: txt.woodblock },
                { id: 'mechanical', label: txt.mechanical },
                { id: 'studio', label: txt.studio },
                { id: 'hihat', label: txt.hihat },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSoundType(s.id as ClickSoundType)}
                  className="py-1 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor:
                      soundType === s.id
                        ? `${theme.accentHex}22`
                        : theme.bgSubtle,
                    borderColor:
                      soundType === s.id
                        ? theme.accentHex
                        : theme.borderPrimary,
                    color:
                      soundType === s.id ? theme.accentHex : theme.textSecondary,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="w-full sm:w-72 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 text-white transition-all"
            style={{
              backgroundColor: isPlaying ? theme.dangerHex : theme.accentHex,
            }}
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>{txt.stopBtn}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{txt.startBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
