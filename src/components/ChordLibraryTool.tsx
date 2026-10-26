import React, { useState, useRef } from 'react';
import { ReferenceToneGenerator } from '../audio/toneGenerator';
import { midiToFrequency } from '../data/instruments';
import { ThemePalette, SupportedLang } from '../i18n/localeTheme';
import { Volume2, Music, Sparkles } from 'lucide-react';

interface ChordShape {
  name: string;
  root: string;
  qualityKey: 'major' | 'minor' | 'dom7' | 'maj7' | 'min7';
  frets: number[];
  fingers: number[];
  notes: string[];
}

const GUITAR_OPEN_MIDIS = [40, 45, 50, 55, 59, 64];
const UKULELE_OPEN_MIDIS = [67, 60, 64, 69];

const GUITAR_CHORDS: ChordShape[] = [
  { name: 'C', root: 'C', qualityKey: 'major', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], notes: ['C', 'E', 'G'] },
  { name: 'Cm', root: 'C', qualityKey: 'minor', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], notes: ['C', 'Eb', 'G'] },
  { name: 'C7', root: 'C', qualityKey: 'dom7', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], notes: ['C', 'E', 'G', 'Bb'] },
  { name: 'Cmaj7', root: 'C', qualityKey: 'maj7', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], notes: ['C', 'E', 'G', 'B'] },
  { name: 'D', root: 'D', qualityKey: 'major', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], notes: ['D', 'F#', 'A'] },
  { name: 'Dm', root: 'D', qualityKey: 'minor', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], notes: ['D', 'F', 'A'] },
  { name: 'D7', root: 'D', qualityKey: 'dom7', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], notes: ['D', 'F#', 'A', 'C'] },
  { name: 'Dm7', root: 'D', qualityKey: 'min7', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], notes: ['D', 'F', 'A', 'C'] },
  { name: 'E', root: 'E', qualityKey: 'major', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], notes: ['E', 'G#', 'B'] },
  { name: 'Em', root: 'E', qualityKey: 'minor', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], notes: ['E', 'G', 'B'] },
  { name: 'E7', root: 'E', qualityKey: 'dom7', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], notes: ['E', 'G#', 'B', 'D'] },
  { name: 'Em7', root: 'E', qualityKey: 'min7', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], notes: ['E', 'G', 'B', 'D'] },
  { name: 'F', root: 'F', qualityKey: 'major', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], notes: ['F', 'A', 'C'] },
  { name: 'Fm', root: 'F', qualityKey: 'minor', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], notes: ['F', 'Ab', 'C'] },
  { name: 'Fmaj7', root: 'F', qualityKey: 'maj7', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], notes: ['F', 'A', 'C', 'E'] },
  { name: 'G', root: 'G', qualityKey: 'major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], notes: ['G', 'B', 'D'] },
  { name: 'Gm', root: 'G', qualityKey: 'minor', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], notes: ['G', 'Bb', 'D'] },
  { name: 'G7', root: 'G', qualityKey: 'dom7', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], notes: ['G', 'B', 'D', 'F'] },
  { name: 'A', root: 'A', qualityKey: 'major', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], notes: ['A', 'C#', 'E'] },
  { name: 'Am', root: 'A', qualityKey: 'minor', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], notes: ['A', 'C', 'E'] },
  { name: 'A7', root: 'A', qualityKey: 'dom7', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], notes: ['A', 'C#', 'E', 'G'] },
  { name: 'Am7', root: 'A', qualityKey: 'min7', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], notes: ['A', 'C', 'E', 'G'] },
  { name: 'B', root: 'B', qualityKey: 'major', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], notes: ['B', 'D#', 'F#'] },
  { name: 'Bm', root: 'B', qualityKey: 'minor', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], notes: ['B', 'D', 'F#'] },
  { name: 'B7', root: 'B', qualityKey: 'dom7', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], notes: ['B', 'D#', 'F#', 'A'] },
];

const UKULELE_CHORDS: ChordShape[] = [
  { name: 'C', root: 'C', qualityKey: 'major', frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3], notes: ['C', 'E', 'G'] },
  { name: 'Cm', root: 'C', qualityKey: 'minor', frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3], notes: ['C', 'Eb', 'G'] },
  { name: 'C7', root: 'C', qualityKey: 'dom7', frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1], notes: ['C', 'E', 'G', 'Bb'] },
  { name: 'Cmaj7', root: 'C', qualityKey: 'maj7', frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2], notes: ['C', 'E', 'G', 'B'] },
  { name: 'D', root: 'D', qualityKey: 'major', frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0], notes: ['D', 'F#', 'A'] },
  { name: 'Dm', root: 'D', qualityKey: 'minor', frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0], notes: ['D', 'F', 'A'] },
  { name: 'D7', root: 'D', qualityKey: 'dom7', frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2], notes: ['D', 'F#', 'A', 'C'] },
  { name: 'E', root: 'E', qualityKey: 'major', frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1], notes: ['E', 'G#', 'B'] },
  { name: 'Em', root: 'E', qualityKey: 'minor', frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1], notes: ['E', 'G', 'B'] },
  { name: 'E7', root: 'E', qualityKey: 'dom7', frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3], notes: ['E', 'G#', 'B', 'D'] },
  { name: 'F', root: 'F', qualityKey: 'major', frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0], notes: ['F', 'A', 'C'] },
  { name: 'Fm', root: 'F', qualityKey: 'minor', frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4], notes: ['F', 'Ab', 'C'] },
  { name: 'G', root: 'G', qualityKey: 'major', frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2], notes: ['G', 'B', 'D'] },
  { name: 'Gm', root: 'G', qualityKey: 'minor', frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1], notes: ['G', 'Bb', 'D'] },
  { name: 'G7', root: 'G', qualityKey: 'dom7', frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3], notes: ['G', 'B', 'D', 'F'] },
  { name: 'A', root: 'A', qualityKey: 'major', frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0], notes: ['A', 'C#', 'E'] },
  { name: 'Am', root: 'A', qualityKey: 'minor', frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0], notes: ['A', 'C', 'E'] },
  { name: 'A7', root: 'A', qualityKey: 'dom7', frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0], notes: ['A', 'C#', 'E', 'G'] },
  { name: 'B', root: 'B', qualityKey: 'major', frets: [4, 3, 2, 2], fingers: [3, 2, 1, 1], notes: ['B', 'D#', 'F#'] },
  { name: 'Bm', root: 'B', qualityKey: 'minor', frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1], notes: ['B', 'D', 'F#'] },
];

const CHORD_TEXT: Record<
  SupportedLang,
  {
    guitarBtn: string;
    ukuleleBtn: string;
    rootLabel: string;
    qualities: Record<ChordShape['qualityKey'], string>;
    clickStringHint: string;
    fretUnit: (n: number) => string;
    chordNotesLabel: string;
    fingeringTitle: string;
    f1: string;
    f2: string;
    f3: string;
    f4: string;
    fOpen: string;
    fMute: string;
    strumBtn: (name: string) => string;
    synthNote: string;
  }
> = {
  zh: {
    guitarBtn: '吉他和弦指法 (6弦)',
    ukuleleBtn: '尤克里里指法 (4弦)',
    rootLabel: '根音:',
    qualities: {
      major: '大三和弦',
      minor: '小三和弦',
      dom7: '属七和弦',
      maj7: '大七和弦',
      min7: '小七和弦',
    },
    clickStringHint: '点击下方任意琴弦可单独试听该弦品位原声',
    fretUnit: (n) => `${n}品`,
    chordNotesLabel: '构成音：',
    fingeringTitle: '左手按弦指法说明：',
    f1: '• 1：食指',
    f2: '• 2：中指',
    f3: '• 3：无名指',
    f4: '• 4：小指',
    fOpen: '• ○：空弦弹响',
    fMute: '• ×：闷音不弹',
    strumBtn: (name) => `原声扫弦试听 ${name} 和弦`,
    synthNote: '采用物理波导弦振动合成与琴体共鸣箱滤波，还原真实拨弦听感。',
  },
  en: {
    guitarBtn: 'Guitar Chords (6-String)',
    ukuleleBtn: 'Ukulele Chords (4-String)',
    rootLabel: 'Root:',
    qualities: {
      major: 'Major Triad',
      minor: 'Minor Triad',
      dom7: 'Dominant 7th',
      maj7: 'Major 7th',
      min7: 'Minor 7th',
    },
    clickStringHint: 'Tap any string on the fretboard below to audition single note',
    fretUnit: (n) => `Fret ${n}`,
    chordNotesLabel: 'Chord Notes:',
    fingeringTitle: 'Left-Hand Fingering Guide:',
    f1: '• 1: Index Finger',
    f2: '• 2: Middle Finger',
    f3: '• 3: Ring Finger',
    f4: '• 4: Pinky Finger',
    fOpen: '• ○: Open String',
    fMute: '• ×: Muted String',
    strumBtn: (name) => `Strum & Audition ${name} Chord`,
    synthNote: 'Powered by Karplus-Strong physical string synthesis & body resonance.',
  },
  ja: {
    guitarBtn: 'ギターコード (6弦)',
    ukuleleBtn: 'ウクレレコード (4弦)',
    rootLabel: 'ルート音:',
    qualities: {
      major: 'メジャーコード',
      minor: 'マイナーコード',
      dom7: 'セブンスコード',
      maj7: 'メジャーセブンス',
      min7: 'マイナーセブンス',
    },
    clickStringHint: '下の指板の弦をタップすると単音を試聴できます',
    fretUnit: (n) => `${n}F`,
    chordNotesLabel: '構成音：',
    fingeringTitle: '左手の押弦ガイド：',
    f1: '• 1：人差し指',
    f2: '• 2：中指',
    f3: '• 3：薬指',
    f4: '• 4：小指',
    fOpen: '• ○：開放弦',
    fMute: '• ×：ミュート',
    strumBtn: (name) => `${name} コードをストローク試聴`,
    synthNote: '物理モデリング弦振動合成によりリアルな楽器の響きを再現します。',
  },
};

export const ChordLibraryTool: React.FC<{
  a4Hz: number;
  theme: ThemePalette;
  lang: SupportedLang;
}> = ({ a4Hz, theme, lang }) => {
  const txt = CHORD_TEXT[lang];
  const [instrument, setInstrument] = useState<'guitar' | 'ukulele'>('guitar');
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [selectedChordName, setSelectedChordName] = useState<string>('C');
  const synthRef = useRef<ReferenceToneGenerator>(new ReferenceToneGenerator());

  const chordsList = instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;
  const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const filteredChords = chordsList.filter((c) => c.root === selectedRoot);
  const currentChord =
    chordsList.find((c) => c.name === selectedChordName) ||
    filteredChords[0] ||
    chordsList[0];

  const handleStrumChord = (chord: ChordShape) => {
    const openMidis =
      instrument === 'guitar' ? GUITAR_OPEN_MIDIS : UKULELE_OPEN_MIDIS;
    const timbre =
      instrument === 'guitar' ? 'acoustic-guitar' : 'ukulele-nylon';
    const freqs: number[] = [];

    chord.frets.forEach((fret, idx) => {
      if (fret >= 0) {
        const midi = openMidis[idx] + fret;
        freqs.push(midiToFrequency(midi, a4Hz, 'equal'));
      }
    });

    synthRef.current.triggerChordStrum(freqs, timbre, 0.65);
  };

  const handlePluckSingleString = (stringIdx: number, fret: number) => {
    if (fret < 0) return;
    const openMidis =
      instrument === 'guitar' ? GUITAR_OPEN_MIDIS : UKULELE_OPEN_MIDIS;
    const timbre =
      instrument === 'guitar' ? 'acoustic-guitar' : 'ukulele-nylon';
    const midi = openMidis[stringIdx] + fret;
    const freq = midiToFrequency(midi, a4Hz, 'equal');
    synthRef.current.triggerPluck(freq, 0.65, timbre);
  };

  const numStrings = instrument === 'guitar' ? 6 : 4;
  const numFrets = 5;

  return (
    <div
      className="w-full rounded-2xl border p-4 sm:p-6 shadow-xl space-y-5 transition-colors duration-300"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.borderPrimary,
        color: theme.textPrimary,
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: theme.borderPrimary }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInstrument('guitar');
              setSelectedRoot('C');
              setSelectedChordName('C');
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all"
            style={{
              backgroundColor:
                instrument === 'guitar'
                  ? `${theme.accentHex}22`
                  : theme.bgSubtle,
              borderColor:
                instrument === 'guitar' ? theme.accentHex : theme.borderPrimary,
              color:
                instrument === 'guitar' ? theme.accentHex : theme.textSecondary,
            }}
          >
            {txt.guitarBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setInstrument('ukulele');
              setSelectedRoot('C');
              setSelectedChordName('C');
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all"
            style={{
              backgroundColor:
                instrument === 'ukulele'
                  ? `${theme.accentHex}22`
                  : theme.bgSubtle,
              borderColor:
                instrument === 'ukulele' ? theme.accentHex : theme.borderPrimary,
              color:
                instrument === 'ukulele' ? theme.accentHex : theme.textSecondary,
            }}
          >
            {txt.ukuleleBtn}
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-xs mr-1"
            style={{ color: theme.textSecondary }}
          >
            {txt.rootLabel}
          </span>
          {roots.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setSelectedRoot(r);
                const first = chordsList.find((c) => c.root === r);
                if (first) setSelectedChordName(first.name);
              }}
              className="w-8 h-8 rounded-lg font-mono text-xs font-bold border transition-all"
              style={{
                backgroundColor:
                  selectedRoot === r
                    ? `${theme.secondaryHex}25`
                    : theme.bgSubtle,
                borderColor:
                  selectedRoot === r
                    ? theme.secondaryHex
                    : theme.borderPrimary,
                color:
                  selectedRoot === r
                    ? theme.secondaryHex
                    : theme.textSecondary,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filteredChords.map((c) => {
          const active = c.name === currentChord.name;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setSelectedChordName(c.name);
                handleStrumChord(c);
              }}
              className="px-3.5 py-2 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: active
                  ? `${theme.accentHex}20`
                  : theme.bgSubtle,
                borderColor: active ? theme.accentHex : theme.borderPrimary,
              }}
            >
              <div className="font-mono text-sm font-extrabold">{c.name}</div>
              <div
                className="text-[10px]"
                style={{ color: theme.textSecondary }}
              >
                {txt.qualities[c.qualityKey]}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
        <div
          className="flex flex-col items-center rounded-2xl p-4 border"
          style={{
            backgroundColor: theme.bgSubtle,
            borderColor: theme.borderPrimary,
          }}
        >
          <div
            className="text-xs mb-2"
            style={{ color: theme.textSecondary }}
          >
            {txt.clickStringHint}
          </div>
          <svg viewBox="0 0 260 270" className="w-full max-w-[260px] h-auto">
            <line
              x1="45"
              y1="42"
              x2="215"
              y2="42"
              stroke={theme.textPrimary}
              strokeWidth="5"
              strokeLinecap="round"
            />

            {Array.from({ length: numFrets }).map((_, fIdx) => {
              const y = 42 + (fIdx + 1) * 40;
              return (
                <g key={`fret-${fIdx}`}>
                  <line
                    x1="45"
                    y1={y}
                    x2="215"
                    y2={y}
                    stroke={theme.borderPrimary}
                    strokeWidth="2"
                  />
                  <text
                    x="22"
                    y={y - 20}
                    fill={theme.textMuted}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {txt.fretUnit(fIdx + 1)}
                  </text>
                </g>
              );
            })}

            {currentChord.frets.map((fret, sIdx) => {
              const span = 170;
              const x = 45 + (sIdx / (numStrings - 1)) * span;
              const finger = currentChord.fingers[sIdx];

              return (
                <g
                  key={`str-${sIdx}`}
                  onClick={() => handlePluckSingleString(sIdx, fret)}
                  className="cursor-pointer group"
                >
                  <line
                    x1={x}
                    y1="42"
                    x2={x}
                    y2={42 + numFrets * 40}
                    stroke={fret < 0 ? theme.textMuted : theme.textSecondary}
                    strokeWidth={instrument === 'guitar' ? 2.6 - sIdx * 0.25 : 2}
                  />

                  {fret < 0 && (
                    <text
                      x={x}
                      y="24"
                      textAnchor="middle"
                      fill={theme.dangerHex}
                      fontSize="14"
                      fontWeight="bold"
                    >
                      ×
                    </text>
                  )}
                  {fret === 0 && (
                    <circle
                      cx={x}
                      cy="22"
                      r="6"
                      fill="none"
                      stroke={theme.accentHex}
                      strokeWidth="2"
                    />
                  )}

                  {fret > 0 && (
                    <g>
                      <circle
                        cx={x}
                        cy={42 + (fret - 0.5) * 40}
                        r="12"
                        fill={theme.accentHex}
                      />
                      <text
                        x={x}
                        y={42 + (fret - 0.5) * 40}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {finger > 0 ? finger : ''}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold">
                {currentChord.name}
              </span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border"
                style={{
                  backgroundColor: `${theme.accentHex}20`,
                  color: theme.accentHex,
                  borderColor: `${theme.accentHex}44`,
                }}
              >
                {txt.qualities[currentChord.qualityKey]}
              </span>
            </div>
            <p
              className="text-xs sm:text-sm mt-1"
              style={{ color: theme.textSecondary }}
            >
              {txt.chordNotesLabel}{' '}
              <span
                className="font-mono font-bold"
                style={{ color: theme.secondaryHex }}
              >
                {currentChord.notes.join(' - ')}
              </span>
            </p>
          </div>

          <div
            className="p-3.5 rounded-xl border space-y-2 text-xs"
            style={{
              backgroundColor: theme.bgSubtle,
              borderColor: theme.borderPrimary,
            }}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" style={{ color: theme.accentHex }} />
              <span>{txt.fingeringTitle}</span>
            </div>
            <div
              className="grid grid-cols-2 gap-1.5 text-[11px]"
              style={{ color: theme.textSecondary }}
            >
              <span>{txt.f1}</span>
              <span>{txt.f2}</span>
              <span>{txt.f3}</span>
              <span>{txt.f4}</span>
              <span>{txt.fOpen}</span>
              <span>{txt.fMute}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleStrumChord(currentChord)}
            className="w-full py-3.5 px-5 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: theme.accentHex }}
          >
            <Volume2 className="w-5 h-5" />
            <span>{txt.strumBtn(currentChord.name)}</span>
          </button>

          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: theme.textMuted }}
          >
            <Sparkles
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: theme.warnHex }}
            />
            <span>{txt.synthNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
