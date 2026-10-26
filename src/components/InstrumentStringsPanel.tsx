import React from 'react';
import {
  INSTRUMENT_PRESETS,
  InstrumentPreset,
  TuningVariant,
  StringSpec,
  TemperamentId,
  midiToFrequency,
} from '../data/instruments';
import { ThemePalette, SupportedLang, UI_TRANSLATIONS } from '../i18n/localeTheme';
import { CheckCircle2, Lock, Volume2, RotateCcw, ArrowRight } from 'lucide-react';

interface InstrumentStringsPanelProps {
  selectedPreset: InstrumentPreset;
  selectedTuning: TuningVariant;
  targetMidi: number;
  a4Hz: number;
  temperament: TemperamentId;
  isManualLocked: boolean;
  autoAdvanceNextString: boolean;
  tunedStrings: Set<number>;
  theme: ThemePalette;
  lang: SupportedLang;
  onSelectPreset: (preset: InstrumentPreset) => void;
  onSelectTuning: (tuning: TuningVariant) => void;
  onSelectString: (str: StringSpec, playPreview: boolean) => void;
  onToggleAutoAdvance: () => void;
  onResetTunedStrings: () => void;
}

export const InstrumentStringsPanel: React.FC<InstrumentStringsPanelProps> = ({
  selectedPreset,
  selectedTuning,
  targetMidi,
  a4Hz,
  temperament,
  isManualLocked,
  autoAdvanceNextString,
  tunedStrings,
  theme,
  lang,
  onSelectPreset,
  onSelectTuning,
  onSelectString,
  onToggleAutoAdvance,
  onResetTunedStrings,
}) => {
  const t = UI_TRANSLATIONS[lang];
  const allTuned =
    selectedTuning.strings.length > 0 &&
    selectedTuning.strings.every((s) => tunedStrings.has(s.midi));

  return (
    <div
      className="w-full rounded-2xl border p-3.5 sm:p-4 shadow-lg space-y-3.5 transition-colors duration-300"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.borderPrimary,
      }}
    >
      {/* Top Step Guidance Banner (String-First Workflow!) */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs"
        style={{
          backgroundColor: `${theme.accentHex}14`,
          borderColor: `${theme.accentHex}44`,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentHex }} />
          <span>{t.step1SelectString}</span>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] opacity-90">
          <input
            type="checkbox"
            checked={autoAdvanceNextString}
            onChange={onToggleAutoAdvance}
            className="rounded w-3.5 h-3.5 accent-emerald-500"
          />
          <span>
            {lang === 'en'
              ? 'Auto-advance after chime'
              : lang === 'ja'
              ? '完了後に次の弦へ自動移動'
              : '调准响铃后自动切下一根弦'}
          </span>
        </label>
      </div>

      {/* Row 1: Instrument Preset Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {INSTRUMENT_PRESETS.map((preset) => {
          const active = preset.id === selectedPreset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: active
                  ? `${theme.accentHex}24`
                  : theme.isLight
                  ? '#f1f5f9'
                  : 'rgba(15,23,42,0.8)',
                borderColor: active ? theme.accentHex : theme.borderPrimary,
                color: active ? theme.accentHex : theme.textSecondary,
              }}
            >
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Tuning Variant Selector + Reset Progress */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
        style={{ borderColor: theme.borderPrimary }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[190px]">
          <span className="text-xs text-slate-400 shrink-0">
            {t.tuningVariantLabel}
          </span>
          {selectedPreset.tunings.length > 1 ? (
            <select
              value={selectedTuning.id}
              onChange={(e) => {
                const found = selectedPreset.tunings.find(
                  (tv) => tv.id === e.target.value
                );
                if (found) onSelectTuning(found);
              }}
              className="flex-1 text-xs sm:text-sm rounded-lg px-2.5 py-1.5 border focus:outline-none"
              style={{
                backgroundColor: theme.isLight ? '#f8fafc' : '#0f172a',
                color: theme.textPrimary,
                borderColor: theme.borderPrimary,
              }}
            >
              {selectedPreset.tunings.map((tv) => (
                <option key={tv.id} value={tv.id}>
                  {tv.name}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="text-xs sm:text-sm font-medium"
              style={{ color: theme.textPrimary }}
            >
              {selectedTuning.name}
            </span>
          )}
        </div>

        {tunedStrings.size > 0 && (
          <button
            type="button"
            onClick={onResetTunedStrings}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors"
            style={{
              backgroundColor: theme.isLight ? '#f1f5f9' : '#0f172a',
              borderColor: theme.borderPrimary,
              color: theme.textSecondary,
            }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>
              {tunedStrings.size}/{selectedTuning.strings.length}
            </span>
          </button>
        )}
      </div>

      {/* Row 3: Interactive String Buttons Grid (Click to Lock String & Audition!) */}
      <div
        className={`grid gap-2 ${
          selectedTuning.strings.length > 8
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 max-h-56 overflow-y-auto pr-1'
            : selectedTuning.strings.length === 2
            ? 'grid-cols-2'
            : selectedTuning.strings.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3'
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
              className="group relative flex flex-col items-start justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: isCurrentTarget
                  ? `${theme.accentHex}22`
                  : isTuned
                  ? `${theme.accentHex}0d`
                  : isGuzhengGreen
                  ? 'rgba(6, 78, 59, 0.25)'
                  : theme.isLight
                  ? '#f8fafc'
                  : 'rgba(15, 23, 42, 0.78)',
                borderColor: isCurrentTarget
                  ? theme.accentHex
                  : isTuned
                  ? `${theme.accentHex}66`
                  : theme.borderPrimary,
                boxShadow: isCurrentTarget
                  ? `0 0 16px ${theme.accentHex}33`
                  : 'none',
              }}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span
                  className="text-xs sm:text-sm font-bold tracking-tight"
                  style={{
                    color: isCurrentTarget
                      ? theme.accentHex
                      : theme.textPrimary,
                  }}
                >
                  {str.label}
                </span>
                <div className="flex items-center gap-1">
                  {isTuned && (
                    <CheckCircle2
                      className="w-4 h-4 shrink-0"
                      style={{ color: theme.accentHex }}
                    />
                  )}
                  <Volume2
                    className={`w-3.5 h-3.5 transition-opacity ${
                      isCurrentTarget
                        ? 'opacity-90'
                        : 'opacity-40 group-hover:opacity-100'
                    }`}
                    style={{ color: theme.secondaryHex }}
                  />
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between w-full">
                <span
                  className="font-mono text-[11px] font-semibold"
                  style={{ color: theme.secondaryHex }}
                >
                  {exactHz.toFixed(1)} Hz
                </span>
                {isCurrentTarget && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${theme.accentHex}30`,
                      color: theme.accentHex,
                    }}
                  >
                    {isManualLocked ? t.stringLockedBadge : '当前弦'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* All Tuned Banner or Next Untuned String Shortcut */}
      {allTuned ? (
        <div
          className="px-3.5 py-2.5 rounded-xl border text-xs font-bold text-center"
          style={{
            backgroundColor: `${theme.accentHex}20`,
            borderColor: theme.accentHex,
            color: theme.accentHex,
          }}
        >
          {t.allStringsTuned}
        </div>
      ) : (
        tunedStrings.has(targetMidi) && (
          <button
            type="button"
            onClick={() => {
              const untuned = selectedTuning.strings.find(
                (s) => !tunedStrings.has(s.midi)
              );
              if (untuned) onSelectString(untuned, true);
            }}
            className="w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            style={{
              backgroundColor: `${theme.secondaryHex}20`,
              borderColor: theme.secondaryHex,
              color: theme.secondaryHex,
            }}
          >
            <span>{t.nextUntunedString}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )
      )}
    </div>
  );
};
