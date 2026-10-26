import React, { useState, useRef } from 'react';
import { ReferenceToneGenerator } from '../audio/toneGenerator';
import { midiToFrequency } from '../data/instruments';
import { Volume2, Music, Sparkles } from 'lucide-react';

interface ChordShape {
  name: string;
  root: string;
  quality: string;
  qualityLabel: string;
  frets: number[]; // -1 = muted (x), 0 = open, 1..n = fret number
  fingers: number[]; // 0 = open/muted, 1=食指, 2=中指, 3=无名指, 4=小指
  notes: string[];
}

const GUITAR_OPEN_MIDIS = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const UKULELE_OPEN_MIDIS = [67, 60, 64, 69]; // G4 C4 E4 A4

const GUITAR_CHORDS: ChordShape[] = [
  { name: 'C', root: 'C', quality: 'Major', qualityLabel: '大三和弦', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], notes: ['C', 'E', 'G'] },
  { name: 'Cm', root: 'C', quality: 'Minor', qualityLabel: '小三和弦', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], notes: ['C', 'Eb', 'G'] },
  { name: 'C7', root: 'C', quality: '7', qualityLabel: '属七和弦', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], notes: ['C', 'E', 'G', 'Bb'] },
  { name: 'Cmaj7', root: 'C', quality: 'maj7', qualityLabel: '大七和弦', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], notes: ['C', 'E', 'G', 'B'] },
  { name: 'D', root: 'D', quality: 'Major', qualityLabel: '大三和弦', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], notes: ['D', 'F#', 'A'] },
  { name: 'Dm', root: 'D', quality: 'Minor', qualityLabel: '小三和弦', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], notes: ['D', 'F', 'A'] },
  { name: 'D7', root: 'D', quality: '7', qualityLabel: '属七和弦', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], notes: ['D', 'F#', 'A', 'C'] },
  { name: 'Dm7', root: 'D', quality: 'm7', qualityLabel: '小七和弦', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], notes: ['D', 'F', 'A', 'C'] },
  { name: 'E', root: 'E', quality: 'Major', qualityLabel: '大三和弦', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], notes: ['E', 'G#', 'B'] },
  { name: 'Em', root: 'E', quality: 'Minor', qualityLabel: '小三和弦', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], notes: ['E', 'G', 'B'] },
  { name: 'E7', root: 'E', quality: '7', qualityLabel: '属七和弦', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], notes: ['E', 'G#', 'B', 'D'] },
  { name: 'Em7', root: 'E', quality: 'm7', qualityLabel: '小七和弦', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], notes: ['E', 'G', 'B', 'D'] },
  { name: 'F', root: 'F', quality: 'Major', qualityLabel: '大三和弦', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], notes: ['F', 'A', 'C'] },
  { name: 'Fm', root: 'F', quality: 'Minor', qualityLabel: '小三和弦', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], notes: ['F', 'Ab', 'C'] },
  { name: 'Fmaj7', root: 'F', quality: 'maj7', qualityLabel: '大七和弦', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], notes: ['F', 'A', 'C', 'E'] },
  { name: 'G', root: 'G', quality: 'Major', qualityLabel: '大三和弦', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], notes: ['G', 'B', 'D'] },
  { name: 'Gm', root: 'G', quality: 'Minor', qualityLabel: '小三和弦', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], notes: ['G', 'Bb', 'D'] },
  { name: 'G7', root: 'G', quality: '7', qualityLabel: '属七和弦', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], notes: ['G', 'B', 'D', 'F'] },
  { name: 'A', root: 'A', quality: 'Major', qualityLabel: '大三和弦', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], notes: ['A', 'C#', 'E'] },
  { name: 'Am', root: 'A', quality: 'Minor', qualityLabel: '小三和弦', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], notes: ['A', 'C', 'E'] },
  { name: 'A7', root: 'A', quality: '7', qualityLabel: '属七和弦', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], notes: ['A', 'C#', 'E', 'G'] },
  { name: 'Am7', root: 'A', quality: 'm7', qualityLabel: '小七和弦', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], notes: ['A', 'C', 'E', 'G'] },
  { name: 'B', root: 'B', quality: 'Major', qualityLabel: '大三和弦', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], notes: ['B', 'D#', 'F#'] },
  { name: 'Bm', root: 'B', quality: 'Minor', qualityLabel: '小三和弦', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], notes: ['B', 'D', 'F#'] },
  { name: 'B7', root: 'B', quality: '7', qualityLabel: '属七和弦', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], notes: ['B', 'D#', 'F#', 'A'] },
];

const UKULELE_CHORDS: ChordShape[] = [
  { name: 'C', root: 'C', quality: 'Major', qualityLabel: '大三和弦', frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3], notes: ['C', 'E', 'G'] },
  { name: 'Cm', root: 'C', quality: 'Minor', qualityLabel: '小三和弦', frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3], notes: ['C', 'Eb', 'G'] },
  { name: 'C7', root: 'C', quality: '7', qualityLabel: '属七和弦', frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1], notes: ['C', 'E', 'G', 'Bb'] },
  { name: 'Cmaj7', root: 'C', quality: 'maj7', qualityLabel: '大七和弦', frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2], notes: ['C', 'E', 'G', 'B'] },
  { name: 'D', root: 'D', quality: 'Major', qualityLabel: '大三和弦', frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0], notes: ['D', 'F#', 'A'] },
  { name: 'Dm', root: 'D', quality: 'Minor', qualityLabel: '小三和弦', frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0], notes: ['D', 'F', 'A'] },
  { name: 'D7', root: 'D', quality: '7', qualityLabel: '属七和弦', frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2], notes: ['D', 'F#', 'A', 'C'] },
  { name: 'E', root: 'E', quality: 'Major', qualityLabel: '大三和弦', frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1], notes: ['E', 'G#', 'B'] },
  { name: 'Em', root: 'E', quality: 'Minor', qualityLabel: '小三和弦', frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1], notes: ['E', 'G', 'B'] },
  { name: 'E7', root: 'E', quality: '7', qualityLabel: '属七和弦', frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3], notes: ['E', 'G#', 'B', 'D'] },
  { name: 'F', root: 'F', quality: 'Major', qualityLabel: '大三和弦', frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0], notes: ['F', 'A', 'C'] },
  { name: 'Fm', root: 'F', quality: 'Minor', qualityLabel: '小三和弦', frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4], notes: ['F', 'Ab', 'C'] },
  { name: 'G', root: 'G', quality: 'Major', qualityLabel: '大三和弦', frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2], notes: ['G', 'B', 'D'] },
  { name: 'Gm', root: 'G', quality: 'Minor', qualityLabel: '小三和弦', frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1], notes: ['G', 'Bb', 'D'] },
  { name: 'G7', root: 'G', quality: '7', qualityLabel: '属七和弦', frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3], notes: ['G', 'B', 'D', 'F'] },
  { name: 'A', root: 'A', quality: 'Major', qualityLabel: '大三和弦', frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0], notes: ['A', 'C#', 'E'] },
  { name: 'Am', root: 'A', quality: 'Minor', qualityLabel: '小三和弦', frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0], notes: ['A', 'C', 'E'] },
  { name: 'A7', root: 'A', quality: '7', qualityLabel: '属七和弦', frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0], notes: ['A', 'C#', 'E', 'G'] },
  { name: 'Bb', root: 'B', quality: 'Major', qualityLabel: '降B大三', frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1], notes: ['Bb', 'D', 'F'] },
  { name: 'Bm', root: 'B', quality: 'Minor', qualityLabel: '小三和弦', frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1], notes: ['B', 'D', 'F#'] },
];

export const ChordLibraryTool: React.FC<{ a4Hz: number }> = ({ a4Hz }) => {
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
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#111722] via-[#0c1018] to-[#090d14] border border-slate-800/90 p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Top Instrument Switcher & Root Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInstrument('guitar');
              setSelectedRoot('C');
              setSelectedChordName('C');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              instrument === 'guitar'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            吉他和弦库 (6弦 Guitar)
          </button>
          <button
            type="button"
            onClick={() => {
              setInstrument('ukulele');
              setSelectedRoot('C');
              setSelectedChordName('C');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              instrument === 'ukulele'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            尤克里里和弦库 (4弦 Ukulele)
          </button>
        </div>

        {/* Root Key Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1">根音调式:</span>
          {roots.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setSelectedRoot(r);
                const first = chordsList.find((c) => c.root === r);
                if (first) setSelectedChordName(first.name);
              }}
              className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border transition-all ${
                selectedRoot === r
                  ? 'bg-sky-500/25 text-sky-300 border-sky-400/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chord Variants for Selected Root */}
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
              className={`px-3.5 py-2 rounded-xl border text-left transition-all ${
                active
                  ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-mono text-sm font-extrabold">{c.name}</div>
              <div className="text-[10px] text-slate-400">{c.qualityLabel}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive Fretboard Diagram & Strum Audition Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
        {/* Left: SVG Fretboard Diagram */}
        <div className="flex flex-col items-center bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400 mb-2">
            点击下方任意琴弦可单独试听该弦品位原声
          </div>
          <svg viewBox="0 0 260 270" className="w-full max-w-[260px] h-auto">
            {/* Nut (Top thick bar) */}
            <line
              x1="45"
              y1="42"
              x2="215"
              y2="42"
              stroke="#E2E8F0"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Fret Horizontal Lines */}
            {Array.from({ length: numFrets }).map((_, fIdx) => {
              const y = 42 + (fIdx + 1) * 40;
              return (
                <g key={`fret-${fIdx}`}>
                  <line
                    x1="45"
                    y1={y}
                    x2="215"
                    y2={y}
                    stroke="#334155"
                    strokeWidth="2"
                  />
                  <text
                    x="22"
                    y={y - 20}
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {fIdx + 1}品
                  </text>
                </g>
              );
            })}

            {/* Vertical Strings & Finger Dots */}
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
                  {/* Vertical String Line */}
                  <line
                    x1={x}
                    y1="42"
                    x2={x}
                    y2={42 + numFrets * 40}
                    stroke={fret < 0 ? '#475569' : '#94A3B8'}
                    strokeWidth={instrument === 'guitar' ? 2.6 - sIdx * 0.25 : 2}
                  />

                  {/* Top Mute (X) or Open (O) Indicator */}
                  {fret < 0 && (
                    <text
                      x={x}
                      y="24"
                      textAnchor="middle"
                      fill="#F43F5E"
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
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  )}

                  {/* Finger Position Circle on Fretboard */}
                  {fret > 0 && (
                    <g>
                      <circle
                        cx={x}
                        cy={42 + (fret - 0.5) * 40}
                        r="12"
                        fill="#10B981"
                        stroke="#052E16"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={42 + (fret - 0.5) * 40}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#022C22"
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

        {/* Right: Chord Details & Strum Action */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                {currentChord.name}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {currentChord.qualityLabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              构成音（Chord Notes）：{' '}
              <span className="font-mono font-bold text-sky-400">
                {currentChord.notes.join(' - ')}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>左手按弦指法说明：</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
              <span>• 数字 <strong className="text-emerald-400">1</strong>：食指 (Index)</span>
              <span>• 数字 <strong className="text-emerald-400">2</strong>：中指 (Middle)</span>
              <span>• 数字 <strong className="text-emerald-400">3</strong>：无名指 (Ring)</span>
              <span>• 数字 <strong className="text-emerald-400">4</strong>：小指 (Pinky)</span>
              <span>• 顶部 <strong className="text-emerald-400">○</strong>：空弦弹响</span>
              <span>• 顶部 <strong className="text-rose-400">×</strong>：闷音不弹</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleStrumChord(currentChord)}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all"
          >
            <Volume2 className="w-5 h-5" />
            <span>
              原声扫弦试听 {currentChord.name} 和弦 (
              {instrument === 'guitar' ? '木吉他物理建模' : '尤克里里尼龙弦'})
            </span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              采用 Karplus-Strong 物理波导弦振动合成与琴体共鸣箱滤波，还原真实拨弦听感。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
