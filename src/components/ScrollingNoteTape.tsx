import React, { useEffect, useRef } from 'react';
import {
  NOTE_NAMES,
  SOLFEGE_NAMES,
  NotationStyle,
  TemperamentId,
  midiToFrequency,
} from '../data/instruments';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollingNoteTapeProps {
  currentFloatMidi: number; // Continuous floating-point MIDI (e.g. 69.12 for A4 + 12 cents)
  targetMidi: number;       // Integer MIDI of target note
  a4Hz: number;
  temperament: TemperamentId;
  notationStyle: NotationStyle;
  instrumentMidis: Set<number>; // Highlight notes belonging to the selected instrument preset
  onSelectMidi: (midi: number) => void;
  hasSignal: boolean;
  isSoundItMode: boolean;
}

const MIN_MIDI = 21; // A0 (27.5 Hz)
const MAX_MIDI = 108; // C8 (4186 Hz)
const PX_PER_SEMITONE = 68;

export const ScrollingNoteTape: React.FC<ScrollingNoteTapeProps> = ({
  currentFloatMidi,
  targetMidi,
  a4Hz,
  temperament,
  notationStyle,
  instrumentMidis,
  onSelectMidi,
  hasSignal,
  isSoundItMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animatedMidiRef = useRef<number>(targetMidi);

  useEffect(() => {
    let rafId: number;

    const renderTape = () => {
      const desired = hasSignal ? currentFloatMidi : targetMidi;
      animatedMidiRef.current += (desired - animatedMidiRef.current) * 0.22;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
          }
          ctx.save();
          ctx.scale(dpr, dpr);

          const w = rect.width;
          const h = rect.height;
          const centerX = w / 2;
          const centerMidi = animatedMidiRef.current;

          ctx.clearRect(0, 0, w, h);

          // Subtle drum gradient background
          const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
          bgGrad.addColorStop(0, '#070a0f');
          bgGrad.addColorStop(0.18, '#0f1623');
          bgGrad.addColorStop(0.5, '#131c2e');
          bgGrad.addColorStop(0.82, '#0f1623');
          bgGrad.addColorStop(1, '#070a0f');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Determine visible MIDI range
          const halfSpanSemitones = Math.ceil(w / 2 / PX_PER_SEMITONE) + 1;
          const startMidi = Math.max(MIN_MIDI, Math.floor(centerMidi - halfSpanSemitones));
          const endMidi = Math.min(MAX_MIDI, Math.ceil(centerMidi + halfSpanSemitones));

          for (let m = startMidi; m <= endMidi; m++) {
            const x = centerX + (m - centerMidi) * PX_PER_SEMITONE;

            // Draw sub-divisions (quarter-tone / 20-cent ticks between m and m+1)
            for (let sub = 1; sub < 5; sub++) {
              const subX = x + (sub / 5) * PX_PER_SEMITONE;
              ctx.strokeStyle = 'rgba(100, 116, 139, 0.28)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(subX, 0);
              ctx.lineTo(subX, 7);
              ctx.moveTo(subX, h - 7);
              ctx.lineTo(subX, h);
              ctx.stroke();
            }

            const isTarget = m === targetMidi;
            const isPresetString = instrumentMidis.has(m);
            const noteIdx = ((m % 12) + 12) % 12;
            const octave = Math.floor(m / 12) - 1;
            const isSharp = NOTE_NAMES[noteIdx].includes('#');

            // Main semitone tick line
            ctx.strokeStyle = isTarget
              ? '#10B981'
              : isPresetString
              ? '#38BDF8'
              : 'rgba(148, 163, 184, 0.45)';
            ctx.lineWidth = isTarget ? 2 : 1.2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 12);
            ctx.moveTo(x, h - 12);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Preset string dot indicator
            if (isPresetString) {
              ctx.fillStyle = isTarget ? '#10B981' : '#38BDF8';
              ctx.beginPath();
              ctx.arc(x, 15, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }

            // Note Label
            const primaryLabel =
              notationStyle === 'solfege'
                ? `${SOLFEGE_NAMES[noteIdx]}${octave}`
                : `${NOTE_NAMES[noteIdx]}${octave}`;

            ctx.font = isTarget
              ? '700 14px "JetBrains Mono", monospace'
              : isSharp
              ? '500 12px "JetBrains Mono", monospace'
              : '600 13px "JetBrains Mono", monospace';
            ctx.fillStyle = isTarget
              ? '#34D399'
              : isPresetString
              ? '#E0F2FE'
              : isSharp
              ? '#64748B'
              : '#CBD5E1';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(primaryLabel, x, h / 2 - 5);

            // Frequency label under each note (gStrings style)
            const freq = midiToFrequency(m, a4Hz, temperament);
            ctx.font = '500 9.5px "JetBrains Mono", monospace';
            ctx.fillStyle = isTarget ? '#6EE7B7' : '#64748B';
            ctx.fillText(
              `${freq >= 100 ? freq.toFixed(1) : freq.toFixed(2)}Hz`,
              x,
              h / 2 + 10
            );
          }

          // Center Hairline Cursor (Red/Emerald gStrings Vertical Hairline)
          const cursorColor = isSoundItMode
            ? '#38BDF8'
            : hasSignal && Math.abs(currentFloatMidi - targetMidi) <= 0.03
            ? '#10B981'
            : '#F43F5E';

          ctx.strokeStyle = cursorColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, 0);
          ctx.lineTo(centerX, h);
          ctx.stroke();

          // Top & bottom small triangles on center cursor
          ctx.fillStyle = cursorColor;
          ctx.beginPath();
          ctx.moveTo(centerX - 5, 0);
          ctx.lineTo(centerX + 5, 0);
          ctx.lineTo(centerX, 6);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(centerX - 5, h);
          ctx.lineTo(centerX + 5, h);
          ctx.lineTo(centerX, h - 6);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(renderTape);
    };

    rafId = requestAnimationFrame(renderTape);
    return () => cancelAnimationFrame(rafId);
  }, [
    currentFloatMidi,
    targetMidi,
    a4Hz,
    temperament,
    notationStyle,
    instrumentMidis,
    hasSignal,
    isSoundItMode,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;
    const offsetSemitones = (clickX - centerX) / PX_PER_SEMITONE;
    const clickedMidi = Math.round(animatedMidiRef.current + offsetSemitones);
    if (clickedMidi >= MIN_MIDI && clickedMidi <= MAX_MIDI) {
      onSelectMidi(clickedMidi);
    }
  };

  return (
    <div className="relative flex items-center w-full rounded-xl bg-[#090d14] border border-slate-800/90 shadow-inner overflow-hidden select-none">
      {/* Step -1 Semitone Button */}
      <button
        type="button"
        onClick={() => onSelectMidi(Math.max(MIN_MIDI, targetMidi - 1))}
        title="降低半音 (-1 Semitone)"
        className="z-10 flex items-center justify-center w-9 h-14 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 text-slate-300 border-r border-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Interactive Scrolling Drum Canvas */}
      <div className="relative flex-1 h-14 cursor-pointer">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />
        <span className="pointer-events-none absolute right-2 top-1 text-[9px] text-slate-500 hidden sm:inline">
          点击标尺可指定目标音
        </span>
      </div>

      {/* Step +1 Semitone Button */}
      <button
        type="button"
        onClick={() => onSelectMidi(Math.min(MAX_MIDI, targetMidi + 1))}
        title="升高半音 (+1 Semitone)"
        className="z-10 flex items-center justify-center w-9 h-14 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 text-slate-300 border-l border-slate-800 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
