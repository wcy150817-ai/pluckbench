import React from 'react';
import {
  INSTRUMENT_PRESETS,
  InstrumentPreset,
  TuningVariant,
  StringSpec,
  TemperamentId,
  midiToFrequency,
} from '../data/instruments';
import { CheckCircle2, Lock, Unlock, Volume2, RotateCcw } from 'lucide-react';

interface InstrumentStringsPanelProps {
  selectedPreset: InstrumentPreset;
  selectedTuning: TuningVariant;
  targetMidi: number;
  a4Hz: number;
  temperament: TemperamentId;
  snapToStringsOnly: boolean;
  isManualLocked: boolean;
  tunedStrings: Set<number>;
  onSelectPreset: (preset: InstrumentPreset) => void;
  onSelectTuning: (tuning: TuningVariant) => void;
  onSelectString: (str: StringSpec, playPreview: boolean) => void;
  onToggleSnapToStrings: () => void;
  onResetTunedStrings: () => void;
}

export const InstrumentStringsPanel: React.FC<InstrumentStringsPanelProps> = ({
  selectedPreset,
  selectedTuning,
  targetMidi,
  a4Hz,
  temperament,
  snapToStringsOnly,
  isManualLocked,
  tunedStrings,
  onSelectPreset,
  onSelectTuning,
  onSelectString,
  onToggleSnapToStrings,
  onResetTunedStrings,
}) => {
  const isChromatic = selectedPreset.id === 'chromatic';

  return (
    <div className="w-full rounded-2xl bg-[#0d121b] border border-slate-800/90 p-3 sm:p-4 shadow-lg space-y-3">
      {/* Row 1: Instrument Preset Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {INSTRUMENT_PRESETS.map((preset) => {
          const active = preset.id === selectedPreset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Tuning Variant Selector + String Snap Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 border-t border-slate-800/60">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs text-slate-400 shrink-0">定弦方案:</span>
          {selectedPreset.tunings.length > 1 ? (
            <select
              value={selectedTuning.id}
              onChange={(e) => {
                const found = selectedPreset.tunings.find(
                  (t) => t.id === e.target.value
                );
                if (found) onSelectTuning(found);
              }}
              className="flex-1 bg-slate-900 text-slate-100 text-xs sm:text-sm rounded-lg px-2.5 py-1.5 border border-slate-700/80 focus:outline-none focus:border-emerald-500"
            >
              {selectedPreset.tunings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-slate-200">
              {selectedTuning.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isChromatic && (
            <button
              type="button"
              onClick={onToggleSnapToStrings}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                snapToStringsOnly
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="开启后，自动测音将优先匹配当前乐器的各根琴弦，防止杂音跳弦"
            >
              {snapToStringsOnly ? (
                <>
                  <Lock className="w-3 h-3" />
                  <span>智能吸附琴弦</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>半音自由识别</span>
                </>
              )}
            </button>
          )}

          {tunedStrings.size > 0 && (
            <button
              type="button"
              onClick={onResetTunedStrings}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
              title="重置已校准标记"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置进度 ({tunedStrings.size}/{selectedTuning.strings.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Interactive String Buttons Grid / Scrollable List */}
      <div
        className={`grid gap-2 ${
          selectedTuning.strings.length > 8
            ? 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 max-h-44 overflow-y-auto pr-1'
            : selectedTuning.strings.length === 2
            ? 'grid-cols-2'
            : selectedTuning.strings.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-3 sm:grid-cols-6'
        }`}
      >
        {selectedTuning.strings.map((str) => {
          const isCurrentTarget = str.midi === targetMidi;
          const isTuned = tunedStrings.has(str.midi);
          const isGuzhengGreen = str.label.includes('绿');
          const exactHz = midiToFrequency(str.midi, a4Hz, temperament);

          return (
            <button
              key={`${str.stringNumber}-${str.midi}`}
              type="button"
              onClick={() => onSelectString(str, true)}
              className={`group relative flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                isCurrentTarget
                  ? 'bg-emerald-500/20 border-emerald-400/70 shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                  : isGuzhengGreen
                  ? 'bg-emerald-950/30 border-emerald-800/60 hover:border-emerald-600/70'
                  : 'bg-slate-900/75 border-slate-800/90 hover:bg-slate-800/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span
                  className={`text-xs font-bold tracking-tight ${
                    isCurrentTarget
                      ? 'text-emerald-300'
                      : isGuzhengGreen
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }`}
                >
                  {str.label}
                </span>
                <div className="flex items-center gap-1">
                  {isTuned && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <Volume2
                    className={`w-3 h-3 transition-opacity ${
                      isCurrentTarget
                        ? 'text-emerald-300 opacity-90'
                        : 'text-slate-500 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-1 flex items-baseline justify-between w-full">
                <span className="font-mono text-[11px] text-sky-400 font-medium">
                  {exactHz.toFixed(1)} Hz
                </span>
                {isCurrentTarget && isManualLocked && (
                  <span className="text-[9px] px-1 rounded bg-amber-500/25 text-amber-300">
                    锁定
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
