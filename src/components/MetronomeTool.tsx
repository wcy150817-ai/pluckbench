import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Hand, Volume2 } from 'lucide-react';

type ClickSoundType = 'woodblock' | 'mechanical' | 'studio' | 'hihat';
type BeatLevel = 3 | 2 | 1 | 0; // 3 = Strong Accent, 2 = Medium, 1 = Normal, 0 = Mute

const TEMPO_MARKS: { min: number; max: number; name: string; cn: string }[] = [
  { min: 30, max: 59, name: 'Largo', cn: '广板 · 极缓庄重' },
  { min: 60, max: 75, name: 'Adagio', cn: '柔板 · 抒情从容' },
  { min: 76, max: 107, name: 'Andante', cn: '行板 · 漫步节奏' },
  { min: 108, max: 119, name: 'Moderato', cn: '中板 · 稳健均衡' },
  { min: 120, max: 155, name: 'Allegro', cn: '快板 · 明快活力' },
  { min: 156, max: 260, name: 'Presto', cn: '急板 · 极速炫技' },
];

export const MetronomeTool: React.FC = () => {
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beatsPerBar, setBeatsPerBar] = useState<number>(4);
  const [subdivision, setSubdivision] = useState<number>(1); // 1 = quarter, 2 = eighth, 3 = triplet, 4 = sixteenth
  const [soundType, setSoundType] = useState<ClickSoundType>('woodblock');
  const [volume, setVolume] = useState<number>(0.8);
  const [beatLevels, setBeatLevels] = useState<BeatLevel[]>([3, 1, 2, 1]);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(-1);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

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
        // Crisp filtered metallic noise hi-hat
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
        // Studio click
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
      {/* Main Metronome Display Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#111722] via-[#0c1018] to-[#090d14] border border-slate-800/90 p-4 sm:p-6 shadow-2xl space-y-5">
        {/* Top Row: Tempo Marking & BPM Readout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/70 pb-4">
          <div className="text-center sm:text-left">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {tempoMark.name} · {tempoMark.cn}
            </span>
            <div className="mt-2 flex items-baseline justify-center sm:justify-start gap-2">
              <span className="font-mono text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
                {bpm}
              </span>
              <span className="text-sm font-mono text-slate-400">BPM (拍/分钟)</span>
            </div>
          </div>

          {/* Step Controls & Tap Tempo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBpm((b) => Math.max(30, b - 5))}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.max(30, b - 1))}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.min(260, b + 1))}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setBpm((b) => Math.min(260, b + 5))}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300"
            >
              +5
            </button>
            <button
              type="button"
              onClick={handleTapTempo}
              className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-300 border border-sky-500/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
            >
              <Hand className="w-4 h-4" />
              <span>点击测速 (Tap)</span>
            </button>
          </div>
        </div>

        {/* BPM Slider & Quick Presets */}
        <div className="space-y-2">
          <input
            type="range"
            min={30}
            max={260}
            step={1}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {[60, 72, 80, 90, 100, 110, 120, 132, 144, 160, 180].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBpm(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                  bpm === preset
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Visual Beat Accent Matrix */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>节拍强弱矩阵（点击任意拍可切换：强拍 / 次强拍 / 弱拍 / 静音）</span>
            <span className="font-mono text-emerald-400">{beatsPerBar}/4 拍</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {beatLevels.map((lvl, idx) => {
              const isCurrent = isPlaying && activeBeatIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleBeatLevel(idx)}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? lvl === 3
                        ? 'bg-emerald-500/35 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.5)] scale-[1.03]'
                        : 'bg-sky-500/30 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)] scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-mono text-slate-400">
                    第 {idx + 1} 拍
                  </span>
                  {/* Visual Bars for Level 3 / 2 / 1 / 0 */}
                  <div className="flex items-end gap-1 h-8 my-1.5">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={`w-2.5 rounded-sm transition-all ${
                          bar === 1 ? 'h-3' : bar === 2 ? 'h-5' : 'h-8'
                        } ${
                          lvl >= bar
                            ? lvl === 3
                              ? 'bg-emerald-400'
                              : lvl === 2
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">
                    {lvl === 3
                      ? '强拍 Accent'
                      : lvl === 2
                      ? '次强拍'
                      : lvl === 1
                      ? '普通拍'
                      : '静音 Mute'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Signature, Subdivision & Click Sound Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/70">
          {/* Time Signature */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">
              拍号 (每小节拍数)
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[2, 3, 4, 5, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleChangeBeatsPerBar(cnt)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-semibold border ${
                    beatsPerBar === cnt
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {cnt}/4
                </button>
              ))}
            </div>
          </div>

          {/* Subdivision */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">
              节奏细分 (Subdivision)
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { sub: 1, label: '♩ 一拍' },
                { sub: 2, label: '♪♪ 二分' },
                { sub: 3, label: '3 三连音' },
                { sub: 4, label: '♬ 十六分' },
              ].map((item) => (
                <button
                  key={item.sub}
                  type="button"
                  onClick={() => setSubdivision(item.sub)}
                  className={`py-1.5 rounded-lg text-xs font-medium border ${
                    subdivision === item.sub
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Click Timbre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>节拍器音色</span>
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'woodblock', label: '红木木鱼' },
                { id: 'mechanical', label: '机械钟摆' },
                { id: 'studio', label: '录音棚电子' },
                { id: 'hihat', label: '架子鼓踩镲' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSoundType(s.id as ClickSoundType)}
                  className={`py-1 rounded-lg text-xs font-medium border ${
                    soundType === s.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start / Stop Master Button */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={`w-full sm:w-72 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_24px_rgba(244,63,94,0.4)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.4)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>停止节拍器 (STOP)</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>启动节拍器 (START)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
