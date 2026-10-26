import React, { useState, useRef } from 'react';
import { ReferenceToneGenerator } from '../audio/toneGenerator';
import { NOTE_NAMES, SOLFEGE_NAMES, midiToFrequency } from '../data/instruments';
import { ThemePalette, SupportedLang } from '../i18n/localeTheme';
import { Volume2, Award, RefreshCw, Play, Square, Radio } from 'lucide-react';

const EAR_TEXT: Record<
  SupportedLang,
  {
    title: string;
    subtitle: string;
    scoreLabel: string;
    streakLabel: string;
    timbreLabel: string;
    tGuitar: string;
    tGuzheng: string;
    tPiano: string;
    tViolin: string;
    refC4Btn: string;
    playQuizBtn: string;
    nextQuestionTitle: string;
    correctMsg: (note: string, solf: string) => string;
    wrongMsg: (note: string, solf: string) => string;
    genTitle: string;
    genSub: string;
    startToneBtn: string;
    stopToneBtn: string;
  }
> = {
  zh: {
    title: '真实乐器音感练耳训练',
    subtitle: '先听标准参照音 C4 (Do)，再听盲测音，训练调弦耳力与音高辨别',
    scoreLabel: '得分:',
    streakLabel: '连胜:',
    timbreLabel: '出题音色:',
    tGuitar: '原声木吉他',
    tGuzheng: '中国古筝',
    tPiano: '三角钢琴',
    tViolin: '小提琴',
    refC4Btn: '听基准音 C4 (Do)',
    playQuizBtn: '播放题目音',
    nextQuestionTitle: '换一题',
    correctMsg: (n, s) => `回答正确！刚刚播放的是 ${n}4 (${s}) · 即将进入下一题`,
    wrongMsg: (n, s) => `再听听看：你刚才点的是 ${n}4 (${s})，可点击播放题目音对比`,
    genTitle: '任意频率正弦音叉发生器 (25 Hz ~ 2000 Hz 连续可调)',
    genSub: '可用于测试乐器箱体共振点、音箱频响或固定频率耳调校准',
    startToneBtn: '持续发生频率',
    stopToneBtn: '停止发音',
  },
  en: {
    title: 'Acoustic Instrument Pitch & Solfège Ear Trainer',
    subtitle: 'Listen to Reference C4 (Do), then identify the mystery note to train your ear',
    scoreLabel: 'Score:',
    streakLabel: 'Streak:',
    timbreLabel: 'Timbre:',
    tGuitar: 'Acoustic Guitar',
    tGuzheng: 'Concert Zither',
    tPiano: 'Grand Piano',
    tViolin: 'Violin',
    refC4Btn: 'Play Ref C4 (Do)',
    playQuizBtn: 'Play Mystery Note',
    nextQuestionTitle: 'New Note',
    correctMsg: (n, s) => `Correct! That note was ${n}4 (${s}) · Loading next note...`,
    wrongMsg: (n, s) => `Try again: You tapped ${n}4 (${s}). Tap "Play Mystery Note" to compare.`,
    genTitle: 'Precision Sine Tuning Fork Generator (25 Hz – 2000 Hz)',
    genSub: 'Ideal for testing instrument body resonance, speaker response, or ear calibration',
    startToneBtn: 'Start Tone',
    stopToneBtn: 'Stop Tone',
  },
  ja: {
    title: 'リアル楽器ピッチ＆相対音感イヤートレーナー',
    subtitle: '基準音 C4 (Do) を聴いてから出題音を当てて、調律の耳を鍛えましょう',
    scoreLabel: 'スコア:',
    streakLabel: '連続正解:',
    timbreLabel: '楽器音色:',
    tGuitar: 'アコギ',
    tGuzheng: '中国古筝',
    tPiano: 'グランドピアノ',
    tViolin: 'バイオリン',
    refC4Btn: '基準音 C4 (Do)',
    playQuizBtn: '出題音を再生',
    nextQuestionTitle: '次の問題',
    correctMsg: (n, s) => `正解です！今の音は ${n}4 (${s}) でした · 次の問題へ進みます`,
    wrongMsg: (n, s) => `もう一度：選択した音は ${n}4 (${s}) です。出題音と聴き比べてみましょう`,
    genTitle: '高精度サイン波・音叉ジェネレーター (25 Hz ～ 2000 Hz)',
    genSub: '楽器の共鳴テストや耳でのチューニング基準音として使用できます',
    startToneBtn: '連続再生開始',
    stopToneBtn: '再生停止',
  },
};

export const EarTrainerTool: React.FC<{
  a4Hz: number;
  theme: ThemePalette;
  lang: SupportedLang;
}> = ({ a4Hz, theme, lang }) => {
  const txt = EAR_TEXT[lang];
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

  const [customFreq, setCustomFreq] = useState<number>(a4Hz);
  const [isSweepPlaying, setIsSweepPlaying] = useState<boolean>(false);

  const synthRef = useRef<ReferenceToneGenerator>(new ReferenceToneGenerator());

  const playMysteryNote = (noteIndex = targetNoteIdx) => {
    const midi = 60 + noteIndex;
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
        message: txt.correctMsg(
          NOTE_NAMES[targetNoteIdx],
          SOLFEGE_NAMES[targetNoteIdx]
        ),
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
        message: txt.wrongMsg(
          NOTE_NAMES[guessedIdx],
          SOLFEGE_NAMES[guessedIdx]
        ),
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
      <div
        className="rounded-2xl border p-4 sm:p-6 shadow-xl space-y-4 transition-colors duration-300"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
          color: theme.textPrimary,
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b"
          style={{ borderColor: theme.borderPrimary }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: theme.accentHex }} />
              <span>{txt.title}</span>
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: theme.textSecondary }}
            >
              {txt.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span
              className="px-3 py-1 rounded-lg border font-bold"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.accentHex,
              }}
            >
              {txt.scoreLabel} {score}
            </span>
            <span
              className="px-3 py-1 rounded-lg border font-bold"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.warnHex,
              }}
            >
              {txt.streakLabel} {streak} 🔥
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs" style={{ color: theme.textSecondary }}>
              {txt.timbreLabel}
            </span>
            {[
              { id: 'acoustic-guitar', label: txt.tGuitar },
              { id: 'chinese-guzheng', label: txt.tGuzheng },
              { id: 'grand-piano', label: txt.tPiano },
              { id: 'bowed-violin', label: txt.tViolin },
            ].map((tItem) => (
              <button
                key={tItem.id}
                type="button"
                onClick={() =>
                  setSelectedTimbre(
                    tItem.id as
                      | 'acoustic-guitar'
                      | 'chinese-guzheng'
                      | 'grand-piano'
                      | 'bowed-violin'
                  )
                }
                className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                style={{
                  backgroundColor:
                    selectedTimbre === tItem.id
                      ? `${theme.accentHex}22`
                      : theme.bgSubtle,
                  borderColor:
                    selectedTimbre === tItem.id
                      ? theme.accentHex
                      : theme.borderPrimary,
                  color:
                    selectedTimbre === tItem.id
                      ? theme.accentHex
                      : theme.textSecondary,
                }}
              >
                {tItem.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playReferenceC4}
              className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.secondaryHex,
              }}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{txt.refC4Btn}</span>
            </button>
            <button
              type="button"
              onClick={() => playMysteryNote()}
              className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-1.5"
              style={{ backgroundColor: theme.accentHex }}
            >
              <Volume2 className="w-4 h-4" />
              <span>{txt.playQuizBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = Math.floor(Math.random() * 12);
                setTargetNoteIdx(next);
                setFeedback(null);
                playMysteryNote(next);
              }}
              className="p-2 rounded-xl border"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.textSecondary,
              }}
              title={txt.nextQuestionTitle}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className="px-3.5 py-2 rounded-xl text-xs font-medium border"
            style={{
              backgroundColor: feedback.correct
                ? `${theme.accentHex}20`
                : `${theme.warnHex}20`,
              borderColor: feedback.correct ? theme.accentHex : theme.warnHex,
              color: feedback.correct ? theme.accentHex : theme.warnHex,
            }}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {NOTE_NAMES.map((note, idx) => (
            <button
              key={note}
              type="button"
              onClick={() => handleGuess(idx)}
              className="p-3 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              <span className="font-mono text-base font-extrabold">
                {note}4
              </span>
              <span
                className="text-[11px] mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                {SOLFEGE_NAMES[idx]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border p-4 sm:p-6 shadow-xl space-y-4 transition-colors duration-300"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
          color: theme.textPrimary,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Radio className="w-4 h-4" style={{ color: theme.secondaryHex }} />
              <span>{txt.genTitle}</span>
            </h3>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              {txt.genSub}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChangeCustomFreq(customFreq - 1)}
              className="px-2.5 py-1 rounded-lg border text-xs font-mono"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              -1Hz
            </button>
            <span
              className="font-mono text-lg font-extrabold px-2"
              style={{ color: theme.secondaryHex }}
            >
              {customFreq.toFixed(1)} Hz
            </span>
            <button
              type="button"
              onClick={() => handleChangeCustomFreq(customFreq + 1)}
              className="px-2.5 py-1 rounded-lg border text-xs font-mono"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
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
          className="w-full cursor-pointer"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[82.4, 110, 196, 261.6, 293.7, 329.6, 432, 440, 442, 523.3].map(
              (hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => handleChangeCustomFreq(hz)}
                  className="px-2 py-1 rounded-lg border text-[11px] font-mono"
                  style={{
                    backgroundColor: theme.bgSubtle,
                    borderColor: theme.borderPrimary,
                    color: theme.textSecondary,
                  }}
                >
                  {hz}Hz
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={toggleContinuousGenerator}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 text-white transition-all"
            style={{
              backgroundColor: isSweepPlaying
                ? theme.dangerHex
                : theme.secondaryHex,
            }}
          >
            {isSweepPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>{txt.stopToneBtn}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{txt.startToneBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
