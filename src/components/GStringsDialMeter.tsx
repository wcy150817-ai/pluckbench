import React, { useEffect, useRef } from 'react';
import {
  NoteInfo,
  NotationStyle,
  formatNoteDisplay,
  getFreqAtCents,
} from '../data/instruments';
import { EnvelopePhase } from '../audio/pitchDetector';

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
}

export const GStringsDialMeter: React.FC<DialMeterProps> = ({
  targetNote,
  measuredFreq,
  centsOffset,
  hasSignal,
  rmsDb,
  envelopePhase,
  isSustainLocked,
  deepNoiseSuppression,
  dampingMode,
  notationStyle,
  showPitchTrail,
  matchedStringLabel,
  activeTimbreLabel,
  isManualLocked,
  isSoundItMode,
}) => {
  const needleGroupRef = useRef<SVGGElement | null>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics state for smooth needle animation (tuned for anti-jitter stability!)
  const currentAngleRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const targetCentsRef = useRef<number>(0);
  const hasSignalRef = useRef<boolean>(false);
  const pitchHistoryRef = useRef<{ cents: number; active: boolean }[]>([]);

  useEffect(() => {
    targetCentsRef.current =
      hasSignal || isSoundItMode
        ? Math.max(-52, Math.min(52, isSoundItMode ? 0 : centsOffset))
        : 0;
    hasSignalRef.current = hasSignal || isSoundItMode;
  }, [centsOffset, hasSignal, isSoundItMode]);

  // 60/120fps Heavy-Damped Spring Physics Loop for the Needle + Pitch Stability Scope
  useEffect(() => {
    let rafId: number;

    // Higher damping & lower stiffness so the needle glides smoothly like a fluid-filled analog VU meter
    const physicsParams = {
      fast: { stiffness: 0.16, damping: 0.76 },
      balanced: { stiffness: 0.09, damping: 0.82 },
      smooth: { stiffness: 0.045, damping: 0.87 },
    }[dampingMode];

    const animate = () => {
      const active = hasSignalRef.current;
      const desiredCents = active ? targetCentsRef.current : 0;
      const desiredAngle = (desiredCents / 50) * 55;

      const force =
        (desiredAngle - currentAngleRef.current) * physicsParams.stiffness;
      velocityRef.current =
        (velocityRef.current + force) * physicsParams.damping;
      currentAngleRef.current += velocityRef.current;

      if (needleGroupRef.current) {
        needleGroupRef.current.setAttribute(
          'transform',
          `rotate(${currentAngleRef.current.toFixed(2)} 250 245)`
        );
      }

      if (showPitchTrail && trailCanvasRef.current) {
        const hist = pitchHistoryRef.current;
        hist.push({
          cents: desiredCents,
          active,
        });
        if (hist.length > 140) hist.shift();

        const canvas = trailCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.lineWidth = 2;
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
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.82)';
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [dampingMode, showPitchTrail]);

  const absCents = Math.abs(centsOffset);
  const isInTune = (hasSignal && absCents <= 3.5) || isSoundItMode;
  const isClose = hasSignal && absCents > 3.5 && absCents <= 12.0;
  const isFlat = hasSignal && centsOffset < -3.5;
  const isSharp = hasSignal && centsOffset > 3.5;

  const accentColor = isSoundItMode
    ? '#38BDF8'
    : !hasSignal
    ? '#64748B'
    : isInTune
    ? '#10B981'
    : isClose
    ? '#F59E0B'
    : '#F43F5E';

  const noteDisplay = formatNoteDisplay(targetNote, notationStyle);

  // Envelope Phase Human-Readable Label
  const phaseLabel = isSoundItMode
    ? `原声建模发音中 (${activeTimbreLabel || '物理合成'})`
    : !hasSignal
    ? '等待拨弦或拉弓...'
    : envelopePhase === 'attack'
    ? '起振瞬态过滤中 (抑制拨弦偏高)...'
    : envelopePhase === 'decay'
    ? '余音衰减 · 已保持稳态音高'
    : isSustainLocked
    ? '延音稳态已锁定 (Sustain Lock)'
    : '正在追踪基频延音...';

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
    const isInGreenZone = Math.abs(c) <= 3;

    if (!isMajor && !isMedium && Math.abs(c) > 10 && c % 2 !== 0) continue;

    const tickLen = isMajor ? 15 : isMedium ? 10 : 5.5;
    const r1 = outerRadius;
    const r2 = outerRadius - tickLen;

    const x1 = centerX + r1 * Math.cos(angleRad);
    const y1 = centerY + r1 * Math.sin(angleRad);
    const x2 = centerX + r2 * Math.cos(angleRad);
    const y2 = centerY + r2 * Math.sin(angleRad);

    const strokeColor = isInGreenZone
      ? '#10B981'
      : isMajor
      ? '#E2E8F0'
      : isMedium
      ? '#94A3B8'
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
          fill={c === 0 ? '#10B981' : '#94A3B8'}
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
        stroke={c === 0 ? '#38BDF8' : isLabelTick ? '#64748B' : '#334155'}
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
          fill={c === 0 ? '#38BDF8' : '#64748B'}
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
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#111722] via-[#0c1018] to-[#090d14] border border-slate-800/90 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden select-none">
      {/* Subtle top ambient glow based on tuning status */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full blur-3xl transition-all duration-300"
        style={{
          backgroundColor: accentColor,
          opacity: hasSignal || isSoundItMode ? 0.16 : 0.04,
        }}
      />

      {/* Top Hardware-Style LED Tuning Guidance Strip */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1.5 border-b border-slate-800/60 bg-slate-950/40">
        {/* Flat Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isFlat
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'text-slate-500 border border-transparent'
          }`}
        >
          <span className="text-sm font-bold">♭</span>
          <span>偏低 · 需拧紧 ▶</span>
        </div>

        {/* Center Lock & Acoustic Envelope Status */}
        <div className="flex flex-col items-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
              isSoundItMode
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                : isInTune
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSoundItMode
                  ? 'bg-sky-400 animate-pulse'
                  : isInTune
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : hasSignal
                  ? 'bg-amber-400'
                  : 'bg-slate-600'
              }`}
            />
            <span>
              {isSoundItMode
                ? '原声基准音播放中'
                : isInTune
                ? '音准已锁定 IN TUNE'
                : hasSignal
                ? `${centsOffset > 0 ? '+' : ''}${centsOffset.toFixed(1)} ¢`
                : '等待拨弦或发音...'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {phaseLabel}
          </span>
        </div>

        {/* Sharp Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isSharp
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
              : 'text-slate-500 border border-transparent'
          }`}
        >
          <span>◀ 偏高 · 需放松</span>
          <span className="text-sm font-bold">♯</span>
        </div>
      </div>

      {/* Main Dual-Scale Analog SVG Dial */}
      <div className="relative px-2 pt-1 pb-1">
        <svg
          viewBox="0 0 500 265"
          className="w-full h-auto max-h-[245px] mx-auto overflow-visible"
        >
          <defs>
            <linearGradient id="needleGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
            <filter id="needleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="dialFaceGrad" cx="50%" cy="90%" r="85%">
              <stop offset="0%" stopColor="#162032" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#090D14" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          <path
            d="M 55 170 A 210 210 0 0 1 445 170 L 340 245 L 160 245 Z"
            fill="url(#dialFaceGrad)"
          />

          <path
            d="M 88 131 A 198 198 0 0 1 412 131"
            fill="none"
            stroke="#1E293B"
            strokeWidth="3"
          />

          {/* Center ±3.5 Cents Precision Target Zone Arc */}
          <path
            d="M 237 47.4 A 198 198 0 0 1 263 47.4"
            fill="none"
            stroke="#10B981"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.85"
          />

          <path
            d="M 139 156 A 144 144 0 0 1 361 156"
            fill="none"
            stroke="#1E293B"
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
            letterSpacing="0.12em"
          >
            CENTS (延音稳态音分偏差)
          </text>
          <text
            x="250"
            y="142"
            textAnchor="middle"
            fill="#38BDF8"
            fontSize="8.5"
            fontWeight="600"
            letterSpacing="0.08em"
            opacity="0.8"
          >
            DYNAMIC Hz (动态频率尺)
          </text>

          <g>{centTicks}</g>
          <g>{hzTicks}</g>

          {/* Damped Physical Needle Group */}
          <g ref={needleGroupRef} transform="rotate(0 250 245)">
            <line
              x1="250"
              y1="245"
              x2="250"
              y2="38"
              stroke="rgba(0,0,0,0.65)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1="250"
              y1="245"
              x2="250"
              y2="36"
              stroke="url(#needleGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              filter="url(#needleGlow)"
            />
            <circle
              cx="250"
              cy="44"
              r="3.2"
              fill="#FFFFFF"
              stroke={accentColor}
              strokeWidth="2"
            />
          </g>

          <circle
            cx="250"
            cy="245"
            r="18"
            fill="#0F172A"
            stroke="#334155"
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
            <div className="relative h-8 rounded-lg bg-slate-950/75 border border-slate-800/80 overflow-hidden flex items-center">
              <canvas
                ref={trailCanvasRef}
                width={360}
                height={32}
                className="w-full h-full"
              />
              <span className="absolute left-2 top-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                延音稳定度轨迹 (过滤瞬态抖动)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Digital Readout Panel */}
      <div className="relative z-10 grid grid-cols-3 items-center gap-2 px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80">
        {/* Left: Target Frequency & Lock Status */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">目标基准</span>
            {isManualLocked && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                已锁弦
              </span>
            )}
            {deepNoiseSuppression && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                强效降噪开启
              </span>
            )}
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-sky-400">
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
                hasSignal || isSoundItMode ? `${accentColor}66` : '#1E293B',
              backgroundColor:
                hasSignal || isSoundItMode ? `${accentColor}15` : '#0F172A',
            }}
          >
            <span
              className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{
                color: hasSignal || isSoundItMode ? '#F8FAFC' : '#94A3B8',
              }}
            >
              {noteDisplay.primary}
            </span>
          </div>
        </div>

        {/* Right: Real-time Sustain Frequency + Mic Level */}
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-slate-400">稳态实测频率</span>
          <div
            className="font-mono text-sm sm:text-base font-bold transition-colors"
            style={{
              color: hasSignal
                ? isInTune
                  ? '#34D399'
                  : '#F8FAFC'
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
          <div className="w-24 h-1.5 mt-1 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${isSoundItMode ? 75 : vuPercent}%`,
                backgroundColor: isInTune
                  ? '#10B981'
                  : vuPercent > 85
                  ? '#F43F5E'
                  : '#38BDF8',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
