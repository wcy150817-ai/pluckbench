import React, { useEffect, useRef } from 'react';
import {
  NOTE_NAMES,
  SOLFEGE_NAMES,
  NotationStyle,
  TemperamentId,
  midiToFrequency,
} from '../data/instruments';
import { ThemePalette, SupportedLang, UI_TEXT } from '../i18n/localeTheme';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollingNoteTapeProps {
  currentFloatMidi: number;
  targetMidi: number;
  a4Hz: number;
  temperament: TemperamentId;
  notationStyle: NotationStyle;
  instrumentMidis: Set<number>;
  onSelectMidi: (midi: number) => void;
  hasSignal: boolean;
  isSoundItMode: boolean;
  theme: ThemePalette;
  lang: SupportedLang;
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
  theme,
  lang,
}) => {
  const t = UI_TEXT[lang];
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
          if (
            canvas.width !== Math.round(rect.width * dpr) ||
            canvas.height !== Math.round(rect.height * dpr)
          ) {
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

          // Subtle drum gradient background matching light or dark theme
          const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
          bgGrad.addColorStop(0, theme.bgPrimary);
          bgGrad.addColorStop(0.2, theme.bgCard);
          bgGrad.addColorStop(0.5, theme.bgSubtle);
          bgGrad.addColorStop(0.8, theme.bgCard);
          bgGrad.addColorStop(1, theme.bgPrimary);
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Determine visible MIDI range
          const halfSpanSemitones = Math.ceil(w / 2 / PX_PER_SEMITONE) + 1;
          const startMidi = Math.max(
            MIN_MIDI,
            Math.floor(centerMidi - halfSpanSemitones)
          );
          const endMidi = Math.min(
            MAX_MIDI,
            Math.ceil(centerMidi + halfSpanSemitones)
          );

          for (let m = startMidi; m <= endMidi; m++) {
            const x = centerX + (m - centerMidi) * PX_PER_SEMITONE;

            // Sub-divisions
            for (let sub = 1; sub < 5; sub++) {
              const subX = x + (sub / 5) * PX_PER_SEMITONE;
              ctx.strokeStyle = theme.isLight
                ? 'rgba(100, 116, 139, 0.25)'
                : 'rgba(100, 116, 139, 0.28)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(subX, 0);
              ctx.lineTo(subX, 6);
              ctx.moveTo(subX, h - 6);
              ctx.lineTo(subX, h);
              ctx.stroke();
            }

            const isTarget = m === targetMidi;
            const isPresetString = instrumentMidis.has(m);
            const noteIdx = ((m % 12) + 12) % 12;
            const octave = Math.floor(m / 12) - 1;
            const isSharp = NOTE_NAMES[noteIdx].includes('#');

            ctx.strokeStyle = isTarget
              ? theme.accentHex
              : isPresetString
              ? theme.secondaryHex
              : 'rgba(148, 163, 184, 0.45)';
            ctx.lineWidth = isTarget ? 2 : 1.2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 11);
            ctx.moveTo(x, h - 11);
            ctx.lineTo(x, h);
            ctx.stroke();

            if (isPresetString) {
              ctx.fillStyle = isTarget ? theme.accentHex : theme.secondaryHex;
              ctx.beginPath();
              ctx.arc(x, 14, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }

            const primaryLabel =
              notationStyle === 'solfege'
                ? `${SOLFEGE_NAMES[noteIdx]}${octave}`
                : `${NOTE_NAMES[noteIdx]}${octave}`;

            ctx.font = isTarget
              ? '700 13px "JetBrains Mono", monospace'
              : isSharp
              ? '500 11.5px "JetBrains Mono", monospace'
              : '600 12.5px "JetBrains Mono", monospace';
            ctx.fillStyle = isTarget
              ? theme.accentHex
              : isPresetString
              ? theme.textPrimary
              : isSharp
              ? theme.textMuted
              : theme.textSecondary;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(primaryLabel, x, h / 2 - 4);

            const freq = midiToFrequency(m, a4Hz, temperament);
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.fillStyle = isTarget ? theme.accentHex : theme.textMuted;
            ctx.fillText(
              `${freq >= 100 ? freq.toFixed(1) : freq.toFixed(2)}Hz`,
              x,
              h / 2 + 10
            );
          }

          // Center Hairline Cursor
          const cursorColor = isSoundItMode
            ? theme.secondaryHex
            : hasSignal && Math.abs(currentFloatMidi - targetMidi) <= 0.05
            ? theme.accentHex
            : theme.dangerHex;

          ctx.strokeStyle = cursorColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, 0);
          ctx.lineTo(centerX, h);
          ctx.stroke();

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
    theme,
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
    <div
      className="relative flex items-center w-full rounded-xl border shadow-inner overflow-hidden select-none transition-colors duration-300"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.borderPrimary,
      }}
    >
      <button
        type="button"
        onClick={() => onSelectMidi(Math.max(MIN_MIDI, targetMidi - 1))}
        aria-label="-1"
        className="z-10 flex items-center justify-center w-8 sm:w-9 h-12 border-r transition-colors"
        style={{
          backgroundColor: theme.bgSubtle,
          borderColor: theme.borderPrimary,
          color: theme.textSecondary,
        }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative flex-1 h-12 cursor-pointer">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />
        <span
          className="pointer-events-none absolute right-2 top-1 text-[9px] hidden sm:inline"
          style={{ color: theme.textMuted }}
        >
          {t.tapeHint}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSelectMidi(Math.min(MAX_MIDI, targetMidi + 1))}
        aria-label="+1"
        className="z-10 flex items-center justify-center w-8 sm:w-9 h-12 border-l transition-colors"
        style={{
          backgroundColor: theme.bgSubtle,
          borderColor: theme.borderPrimary,
          color: theme.textSecondary,
        }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
