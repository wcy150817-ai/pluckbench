import React, { useState, useRef } from 'react';
import { ReferenceToneGenerator } from '../audio/toneGenerator';
import { NOTE_NAMES, SOLFEGE_NAMES, midiToFrequency } from '../data/instruments';
import { Volume2, Award, RefreshCw, Play, Square, Radio } from 'lucide-react';

export const EarTrainerTool: React.FC<{ a4Hz: number }> = ({ a4Hz }) => {
  // Section 1: Pitch Ear Training Game
  const [targetNoteIdx, setTargetNoteIdx] = useState<number>(() =>
    Math.floor(Math.random() * 12)
  );
  const [selectedTimbre, setSelectedTimbre] = useState<
    'acoustic-guitar' | 'chinese-guzheng' | 'grand-piano' | 'bowed-violin'
  >('acoustic-guitar');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Section 2: Continuous Precision Frequency Generator
  const [customFreq, setCustomFreq] = useState<number>(a4Hz);
  const [isSweepPlaying, setIsSweepPlaying] = useState<boolean>(false);

  const synthRef = useRef<ReferenceToneGenerator>(new ReferenceToneGenerator());

  const playMysteryNote = (noteIndex = targetNoteIdx) => {
    const midi = 60 + noteIndex; // C4..B4 octave
    const freq = midiToFrequency(midi, a4Hz, 'equal');
    synthRef.current.triggerPluck(freq, 0.7, selectedTimbre);
  };

  const playReferenceC4 = () => {
    const c4Freq = midiToFrequency(60, a4Hz, 'equal');
    synthRef.current.triggerPluck(c4Freq, 0.65, selectedTimbre);
  };

  const handleGuess = (guessedIdx: number) => {
    const midi = 60 + guessedIdx;
    const freq = midiToFrequency(midi, a4Hz, 'equal');
    synthRef.current.triggerPluck(freq, 0.65, selectedTimbre);

    if (guessedIdx === targetNoteIdx) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      setFeedback({
        correct: true,
        message: `回答正确！刚刚播放的是 ${NOTE_NAMES[targetNoteIdx]}4 (${SOLFEGE_NAMES[targetNoteIdx]}) · 即将播放下一题`,
      });
      setTimeout(() => {
        const nextIdx = Math.floor(Math.random() * 12);
        setTargetNoteIdx(nextIdx);
        setFeedback(null);
        playMysteryNote(nextIdx);
      }, 1100);
    } else {
      setStreak(0);
      setFeedback({
        correct: false,
        message: `再听听看：你刚才点的是 ${NOTE_NAMES[guessedIdx]}4 (${SOLFEGE_NAMES[guessedIdx]})，可以点「重播题目音」对比音高`,
      });
    }
  };

  const toggleContinuousGenerator = () => {
    if (isSweepPlaying) {
      synthRef.current.stopContinuous();
      setIsSweepPlaying(false);
    } else {
      synthRef.current.startContinuous(customFreq, 'tuning-fork', 0.6);
      setIsSweepPlaying(true);
    }
  };

  const handleChangeCustomFreq = (val: number) => {
    const clamped = Math.max(25, Math.min(2000, Number(val.toFixed(1))));
    setCustomFreq(clamped);
    if (isSweepPlaying) {
      synthRef.current.updateFrequency(clamped);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Card 1: Interactive Ear Training Quiz */}
      <div className="rounded-2xl bg-gradient-to-b from-[#111722] via-[#0c1018] to-[#090d14] border border-slate-800/90 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>真实乐器音感练耳训练 (Pitch & Solfège Ear Trainer)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              先听标准参照音 C4 (Do)，再听盲测音，训练调弦耳力与绝对/相对音感
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
              得分: {score}
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold">
              连胜: {streak} 🔥
            </span>
          </div>
        </div>

        {/* Timbre Selector & Play Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400">出题乐器音色:</span>
            {[
              { id: 'acoustic-guitar', label: '原声木吉他' },
              { id: 'chinese-guzheng', label: '中国古筝' },
              { id: 'grand-piano', label: '三角钢琴' },
              { id: 'bowed-violin', label: '小提琴' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setSelectedTimbre(
                    t.id as
                      | 'acoustic-guitar'
                      | 'chinese-guzheng'
                      | 'grand-piano'
                      | 'bowed-violin'
                  )
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  selectedTimbre === t.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playReferenceC4}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>听基准音 C4 (Do)</span>
            </button>
            <button
              type="button"
              onClick={() => playMysteryNote()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
            >
              <Volume2 className="w-4 h-4" />
              <span>播放题目音</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = Math.floor(Math.random() * 12);
                setTargetNoteIdx(next);
                setFeedback(null);
                playMysteryNote(next);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="换一题"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border ${
              feedback.correct
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-200 border-amber-500/40'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* 12 Chromatic Note Answer Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {NOTE_NAMES.map((note, idx) => (
            <button
              key={note}
              type="button"
              onClick={() => handleGuess(idx)}
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center transition-all"
            >
              <span className="font-mono text-base font-extrabold text-white">
                {note}4
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {SOLFEGE_NAMES[idx]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Precision Arbitrary Frequency Generator (25 Hz ~ 2000 Hz) */}
      <div className="rounded-2xl bg-[#0d121b] border border-slate-800/90 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              <span>任意频率正弦音叉发生器 (25 Hz ~ 2000 Hz 连续可调)</span>
            </h3>
            <p className="text-xs text-slate-400">
              可用于测试乐器箱体狼音共振点、音箱频响或固定频率耳调校准
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChangeCustomFreq(customFreq - 1)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
            >
              -1Hz
            </button>
            <button
              type="button"
              onClick={() => handleChangeCustomFreq(customFreq - 0.1)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
            >
              -0.1
            </button>
            <span className="font-mono text-lg font-extrabold text-sky-400 px-2">
              {customFreq.toFixed(1)} Hz
            </span>
            <button
              type="button"
              onClick={() => handleChangeCustomFreq(customFreq + 0.1)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
            >
              +0.1
            </button>
            <button
              type="button"
              onClick={() => handleChangeCustomFreq(customFreq + 1)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
            >
              +1Hz
            </button>
          </div>
        </div>

        <input
          type="range"
          min={25}
          max={1200}
          step={0.5}
          value={customFreq}
          onChange={(e) => handleChangeCustomFreq(Number(e.target.value))}
          className="w-full accent-sky-400 cursor-pointer"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[82.4, 110, 196, 261.6, 293.7, 329.6, 432, 440, 442, 523.3].map(
              (hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => handleChangeCustomFreq(hz)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300"
                >
                  {hz}Hz
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={toggleContinuousGenerator}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all ${
              isSweepPlaying
                ? 'bg-rose-500 text-white'
                : 'bg-sky-500 text-slate-950'
            }`}
          >
            {isSweepPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>停止发音</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>持续发生频率</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
