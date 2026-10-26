import React, { useEffect, useRef } from 'react';
import {
  NoteInfo,
  NotationStyle,
  formatNoteDisplay,
  getFreqAtCents,
} from '../data/instruments';
import { EnvelopePhase } from '../audio/pitchDetector';
import { ThemePalette, SupportedLang, UI_TRANSLATIONS } from '../i18n/localeTheme';

interface DialMeterProps {
  targetNote: NoteInfo;
  measuredFreq: number | null;
  centsOffset: number; // -50 to +50
  hasSignal: boolean;
  clarity: number;
  rmsDb: number;
  envelopePhase: EnvelopePhase;
  isSustainLocked: boolean;
  deepNoiseSuppression: boolean;
  dampingMode: 'fast' | 'balanced' | 'smooth';
  notationStyle: NotationStyle;
  showPitchTrail: boolean;
  matchedStringLabel?: string | null;
  activeTimbreLabel?: string;
  isManualLocked: boolean;
  isSoundItMode: boolean;
  holdProgress: number; // 0 to 100% progress toward confirmation chime
  isCurrentStringTuned: boolean;
  theme: ThemePalette;
  lang: SupportedLang;
}

export const GStringsDialMeter: React.FC<DialMeterProps> = ({
  targetNote,
  measuredFreq,
  centsOffset,
  hasSignal,
  rmsDb,
  deepNoiseSuppression,
  dampingMode,
  notationStyle,
  showPitchTrail,
  matchedStringLabel,
  isManualLocked,
  isSoundItMode,
  holdProgress,
  isCurrentStringTuned,
  theme,
  lang,
}) => {
  const t = UI_TRANSLATIONS[lang];
  const needleGroupRef = useRef<SVGGElement | null>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Overdamped 2-stage fluid filter state (ZERO overshoot, ZERO left-right oscillation!)
  const stage1AngleRef = useRef<number>(0);
  const displayAngleRef = useRef<number>(0);
  const targetCentsRef = useRef<number>(0);
  const hasSignalRef = useRef<boolean>(false);
  const pitchHistoryRef = useRef<{ cents: number; active: boolean }[]>([]);

  useEffect(() => {
    targetCentsRef.current =
      hasSignal || isSoundItMode
        ? Math.max(-50, Math.min(50, isSoundItMode ? 0 : centsOffset))
        : 0;
    hasSignalRef.current = hasSignal || isSoundItMode;
  }, [centsOffset, hasSignal, isSoundItMode]);

  // 60fps Overdamped Fluid Filter (No spring bounce, strict angular speed limit!)
  useEffect(() => {
    let rafId: number;

    const fluidParams = {
      fast: { alpha1: 0.11, alpha2: 0.14, maxStepDeg: 0.85, deadbandDeg: 0.25 },
      balanced: { alpha1: 0.065, alpha2: 0.085, maxStepDeg: 0.48, deadbandDeg: 0.42 },
      smooth: { alpha1: 0.038, alpha2: 0.052, maxStepDeg: 0.28, deadbandDeg: 0.60 },
    }[dampingMode];

    const animate = () => {
      const active = hasSignalRef.current;
      const desiredCents = active ? targetCentsRef.current : 0;
      const desiredAngle = (desiredCents / 50) * 55;

      // Stage 1 exponential low-pass
      const diff1 = desiredAngle - stage1AngleRef.current;
      if (Math.abs(diff1) > fluidParams.deadbandDeg || !active) {
        stage1AngleRef.current += diff1 * (active ? fluidParams.alpha1 : 0.045);
      }

      // Stage 2 velocity-clamped fluid damper (guarantees zero left-right wobble)
      const diff2 = stage1AngleRef.current - displayAngleRef.current;
      const step = Math.max(
        -fluidParams.maxStepDeg,
        Math.min(fluidParams.maxStepDeg, diff2 * fluidParams.alpha2)
      );
      displayAngleRef.current += step;

      // Snap gently within ±1.2° if already inside the ±5¢ green zone
      if (needleGroupRef.current) {
        needleGroupRef.current.setAttribute(
          'transform',
          `rotate(${displayAngleRef.current.toFixed(2)} 250 245)`
        );
      }

      if (showPitchTrail && trailCanvasRef.current) {
        const hist = pitchHistoryRef.current;
        const smoothedCents = (displayAngleRef.current / 55) * 50;
        hist.push({
          cents: smoothedCents,
          active,
        });
        if (hist.length > 140) hist.shift();

        const canvas = trailCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          ctx.strokeStyle = `${theme.accentHex}44`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.lineWidth = 2.2;
          ctx.beginPath();
          let started = false;
          for (let i = 0; i < hist.length; i++) {
            const pt = hist[i];
            if (!pt.active) {
              started = false;
              continue;
            }
            const x = (i / 140) * w;
            const y = h / 2 - (pt.cents / 50) * (h * 0.42);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.strokeStyle = theme.accentHex;
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [dampingMode, showPitchTrail, theme.accentHex]);

  const absCents = Math.abs(centsOffset);
  // ±5 cents forgiving tolerance zone for real instruments
  const isInSmallFluctuationZone = (hasSignal && absCents <= 5.5) || isSoundItMode;
  const isClose = hasSignal && absCents > 5.5 && absCents <= 14.0;
  const isFlat = hasSignal && centsOffset < -5.5;
  const isSharp = hasSignal && centsOffset > 5.5;

  const accentColor = isSoundItMode
    ? theme.secondaryHex
    : !hasSignal
    ? '#64748B'
    : isInSmallFluctuationZone
    ? theme.accentHex
    : isClose
    ? theme.warnHex
    : theme.dangerHex;

  const noteDisplay = formatNoteDisplay(targetNote, notationStyle);

  // Generate Outer Cents Ticks (-50 to +50)
  const centTicks: React.ReactNode[] = [];
  const centerX = 250;
  const centerY = 245;
  const outerRadius = 198;

  for (let c = -50; c <= 50; c += 1) {
    const angleDeg = (c / 50) * 55;
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const isMajor = c % 10 === 0;
    const isMedium = c % 5 === 0 && !isMajor;
    const isInGreenZone = Math.abs(c) <= 5;

    if (!isMajor && !isMedium && Math.abs(c) > 10 && c % 2 !== 0) continue;

    const tickLen = isMajor ? 15 : isMedium ? 10 : 5.5;
    const r1 = outerRadius;
    const r2 = outerRadius - tickLen;

    const x1 = centerX + r1 * Math.cos(angleRad);
    const y1 = centerY + r1 * Math.sin(angleRad);
    const x2 = centerX + r2 * Math.cos(angleRad);
    const y2 = centerY + r2 * Math.sin(angleRad);

    const strokeColor = isInGreenZone
      ? theme.accentHex
      : isMajor
      ? theme.isLight
        ? '#1E293B'
        : '#E2E8F0'
      : isMedium
      ? '#94A3B8'
      : theme.isLight
      ? '#CBD5E1'
      : '#475569';

    centTicks.push(
      <line
        key={`cent-${c}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={isMajor ? 2.2 : isMedium ? 1.4 : 1}
        strokeLinecap="round"
      />
    );

    if (isMajor) {
      const labelR = outerRadius + 15;
      const lx = centerX + labelR * Math.cos(angleRad);
      const ly = centerY + labelR * Math.sin(angleRad);
      const labelText = c > 0 ? `+${c}` : `${c}`;
      centTicks.push(
        <text
          key={`cent-lbl-${c}`}
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="central"
          fill={
            c === 0
              ? theme.accentHex
              : theme.isLight
              ? '#475569'
              : '#94A3B8'
          }
          fontSize={c === 0 ? '12' : '10.5'}
          fontWeight={c === 0 ? '700' : '600'}
          fontFamily="JetBrains Mono, monospace"
        >
          {labelText}
        </text>
      );
    }
  }

  // Generate Inner Dynamic Hz Scale
  const hzTicks: React.ReactNode[] = [];
  const innerRadius = 144;
  for (let c = -45; c <= 45; c += 5) {
    const angleDeg = (c / 50) * 55;
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const isLabelTick = c % 15 === 0;
    const tickLen = isLabelTick ? 9 : 4.5;

    const x1 = centerX + innerRadius * Math.cos(angleRad);
    const y1 = centerY + innerRadius * Math.sin(angleRad);
    const x2 = centerX + (innerRadius - tickLen) * Math.cos(angleRad);
    const y2 = centerY + (innerRadius - tickLen) * Math.sin(angleRad);

    hzTicks.push(
      <line
        key={`hz-tick-${c}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={
          c === 0
            ? theme.secondaryHex
            : isLabelTick
            ? '#64748B'
            : theme.isLight
            ? '#CBD5E1'
            : '#334155'
        }
        strokeWidth={isLabelTick ? 1.5 : 1}
      />
    );

    if (isLabelTick) {
      const freqAtPos = getFreqAtCents(targetNote.frequency, c);
      const labelR = innerRadius - 20;
      const lx = centerX + labelR * Math.cos(angleRad);
      const ly = centerY + labelR * Math.sin(angleRad);
      const formattedHz =
        freqAtPos >= 100 ? freqAtPos.toFixed(1) : freqAtPos.toFixed(2);

      hzTicks.push(
        <text
          key={`hz-lbl-${c}`}
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="central"
          fill={c === 0 ? theme.secondaryHex : '#64748B'}
          fontSize="9.5"
          fontWeight={c === 0 ? '700' : '500'}
          fontFamily="JetBrains Mono, monospace"
        >
          {formattedHz}
        </text>
      );
    }
  }

  const vuPercent = Math.max(0, Math.min(100, ((rmsDb + 65) / 55) * 100));

  return (
    <div
      className="relative w-full rounded-2xl border shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden select-none transition-colors duration-300"
      style={{
        background: `linear-gradient(180deg, ${theme.dialGradientStart} 0%, ${theme.dialGradientEnd} 100%)`,
        borderColor: theme.borderPrimary,
      }}
    >
      {/* Ambient Top Glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full blur-3xl transition-all duration-300"
        style={{
          backgroundColor: accentColor,
          opacity: hasSignal || isSoundItMode ? 0.18 : 0.05,
        }}
      />

      {/* Top Hardware-Style LED Tuning Guidance Strip */}
      <div
        className="relative z-10 flex items-center justify-between px-3 sm:px-4 pt-3 pb-2 border-b"
        style={{
          borderColor: theme.borderPrimary,
          backgroundColor: theme.isLight
            ? 'rgba(241,245,249,0.75)'
            : 'rgba(2,6,23,0.45)',
        }}
      >
        {/* Flat Indicator */}
        <div
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
            isFlat
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-500 border border-transparent'
          }`}
        >
          <span className="text-sm font-bold">♭</span>
          <span>{t.flatTighten}</span>
        </div>

        {/* Center Lock & Hold-to-Confirm Progress Bar */}
        <div className="flex flex-col items-center min-w-[160px] sm:min-w-[220px]">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border transition-all"
            style={{
              backgroundColor:
                isCurrentStringTuned || holdProgress >= 100
                  ? `${theme.accentHex}28`
                  : isInSmallFluctuationZone
                  ? `${theme.accentHex}18`
                  : theme.isLight
                  ? '#e2e8f0'
                  : 'rgba(15,23,42,0.85)',
              borderColor:
                isCurrentStringTuned || isInSmallFluctuationZone
                  ? theme.accentHex
                  : theme.borderPrimary,
              color:
                isCurrentStringTuned || isInSmallFluctuationZone
                  ? theme.accentHex
                  : theme.textPrimary,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isInSmallFluctuationZone
                  ? theme.accentHex
                  : hasSignal
                  ? theme.warnHex
                  : '#64748B',
              }}
            />
            <span>
              {isCurrentStringTuned || holdProgress >= 100
                ? t.inTuneLocked
                : isInSmallFluctuationZone && hasSignal
                ? `${t.holdingForLock} (${Math.round(holdProgress)}%)`
                : hasSignal
                ? `${centsOffset > 0 ? '+' : ''}${centsOffset.toFixed(1)} ¢`
                : t.waitingForString}
            </span>
          </div>

          {/* Hold-in-Small-Fluctuation-Zone Progress Bar (0% -> 100%) */}
          <div className="w-40 sm:w-52 h-1.5 mt-1.5 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50">
            <div
              className="h-full transition-all duration-100 rounded-full"
              style={{
                width: `${isCurrentStringTuned ? 100 : holdProgress}%`,
                backgroundColor: theme.accentHex,
              }}
            />
          </div>
        </div>

        {/* Sharp Indicator */}
        <div
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
            isSharp
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-500 border border-transparent'
          }`}
        >
          <span>{t.sharpLoosen}</span>
          <span className="text-sm font-bold">♯</span>
        </div>
      </div>

      {/* Main Dual-Scale Analog SVG Dial */}
      <div className="relative px-2 pt-1 pb-1">
        <svg
          viewBox="0 0 500 265"
          className="w-full h-auto max-h-[240px] mx-auto overflow-visible"
        >
          <defs>
            <linearGradient id="needleGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="55%" stopColor={accentColor} />
              <stop offset="100%" stopColor={theme.isLight ? '#0f172a' : '#FFFFFF'} />
            </linearGradient>
            <filter id="needleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Scale Track Arc */}
          <path
            d="M 88 131 A 198 198 0 0 1 412 131"
            fill="none"
            stroke={theme.isLight ? '#CBD5E1' : '#1E293B'}
            strokeWidth="3"
          />

          {/* Center ±5 Cents Forgiving Target Fluctuation Zone Arc */}
          <path
            d="M 231.0 47.9 A 198 198 0 0 1 269.0 47.9"
            fill="none"
            stroke={theme.accentHex}
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Inner Dynamic Hz Scale Track Arc */}
          <path
            d="M 139 156 A 144 144 0 0 1 361 156"
            fill="none"
            stroke={theme.isLight ? '#CBD5E1' : '#1E293B'}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          <text
            x="250"
            y="22"
            textAnchor="middle"
            fill="#64748B"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.1em"
          >
            ±5¢ TARGET HOLD ZONE (重流体阻尼防晃表盘)
          </text>
          <text
            x="250"
            y="142"
            textAnchor="middle"
            fill={theme.secondaryHex}
            fontSize="8.5"
            fontWeight="600"
            letterSpacing="0.08em"
            opacity="0.85"
          >
            DYNAMIC Hz (动态频率尺)
          </text>

          <g>{centTicks}</g>
          <g>{hzTicks}</g>

          {/* Overdamped Fluid Needle Group */}
          <g ref={needleGroupRef} transform="rotate(0 250 245)">
            <line
              x1="250"
              y1="245"
              x2="250"
              y2="38"
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1="250"
              y1="245"
              x2="250"
              y2="36"
              stroke="url(#needleGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#needleGlow)"
            />
            <circle
              cx="250"
              cy="44"
              r="3.5"
              fill={theme.isLight ? '#0f172a' : '#FFFFFF'}
              stroke={accentColor}
              strokeWidth="2"
            />
          </g>

          <circle
            cx="250"
            cy="245"
            r="18"
            fill={theme.isLight ? '#e2e8f0' : '#0F172A'}
            stroke={theme.borderPrimary}
            strokeWidth="2.5"
          />
          <circle
            cx="250"
            cy="245"
            r="7"
            fill={accentColor}
            className="transition-colors duration-200"
          />
        </svg>

        {showPitchTrail && (
          <div className="mx-auto max-w-md px-4 -mt-3 mb-1">
            <div
              className="relative h-8 rounded-lg border overflow-hidden flex items-center"
              style={{
                backgroundColor: theme.isLight
                  ? 'rgba(241,245,249,0.9)'
                  : 'rgba(2,6,23,0.75)',
                borderColor: theme.borderPrimary,
              }}
            >
              <canvas
                ref={trailCanvasRef}
                width={360}
                height={32}
                className="w-full h-full"
              />
              <span className="absolute left-2 top-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                HOLD STABILITY SCOPE (±5¢)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Digital Readout Panel */}
      <div
        className="relative z-10 grid grid-cols-3 items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        style={{
          borderColor: theme.borderPrimary,
          backgroundColor: theme.isLight
            ? 'rgba(241,245,249,0.85)'
            : 'rgba(2,6,23,0.72)',
        }}
      >
        {/* Left: Locked Target String & Frequency */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">{t.targetPitch}</span>
            {isManualLocked && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold rounded border"
                style={{
                  backgroundColor: `${theme.accentHex}22`,
                  color: theme.accentHex,
                  borderColor: `${theme.accentHex}55`,
                }}
              >
                {t.stringLockedBadge}
              </span>
            )}
            {deepNoiseSuppression && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                窄带抗噪
              </span>
            )}
          </div>
          <div
            className="font-mono text-sm sm:text-base font-bold"
            style={{ color: theme.secondaryHex }}
          >
            {targetNote.frequency.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">Hz</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-full">
            {matchedStringLabel || noteDisplay.secondary}
          </div>
        </div>

        {/* Center: Prominent Target Note Badge */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="flex items-baseline justify-center gap-1 px-4 py-1 rounded-xl border transition-all duration-200"
            style={{
              borderColor:
                hasSignal || isSoundItMode
                  ? `${accentColor}88`
                  : theme.borderPrimary,
              backgroundColor:
                hasSignal || isSoundItMode
                  ? `${accentColor}18`
                  : theme.bgCard,
            }}
          >
            <span
              className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{
                color: theme.textPrimary,
              }}
            >
              {noteDisplay.primary}
            </span>
          </div>
        </div>

        {/* Right: Stabilized Measured Frequency + Mic Level */}
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-slate-400">{t.measuredPitch}</span>
          <div
            className="font-mono text-sm sm:text-base font-bold transition-colors"
            style={{
              color: hasSignal
                ? isInSmallFluctuationZone
                  ? theme.accentHex
                  : theme.textPrimary
                : '#64748B',
            }}
          >
            {hasSignal && measuredFreq
              ? measuredFreq.toFixed(2)
              : isSoundItMode
              ? targetNote.frequency.toFixed(2)
              : '---.--'}{' '}
            <span className="text-xs font-normal text-slate-400">Hz</span>
          </div>
          <div className="w-20 sm:w-24 h-1.5 mt-1 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${isSoundItMode ? 75 : vuPercent}%`,
                backgroundColor: isInSmallFluctuationZone
                  ? theme.accentHex
                  : vuPercent > 85
                  ? theme.dangerHex
                  : theme.secondaryHex,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
