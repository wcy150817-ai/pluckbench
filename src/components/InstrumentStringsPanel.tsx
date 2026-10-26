import React from 'react';
import {
  INSTRUMENT_PRESETS,
  InstrumentPreset,
  TuningVariant,
  StringSpec,
  TemperamentId,
  midiToFrequency,
} from '../data/instruments';
import { ThemePalette, SupportedLang, UI_TEXT } from '../i18n/localeTheme';
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
  const t = UI_TEXT[lang];
  const allTuned =
    selectedTuning.strings.length > 0 &&
    selectedTuning.strings.every((s) => tunedStrings.has(s.midi));

  return (
    <div
      id="string-selector-panel"
      className="w-full rounded-2xl border p-2.5 sm:p-4 shadow-md space-y-2 sm:space-y-3 transition-colors duration-300"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.borderPrimary,
      }}
    >
      {/* Top Step Guidance Banner + Tuning Variant Selector combined compactly */}
      <div
        className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs"
        style={{
          backgroundColor: `${theme.accentHex}14`,
          borderColor: `${theme.accentHex}44`,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center gap-1.5 font-bold">
          <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentHex }} />
          <span>{t.step1SelectString}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 cursor-pointer text-[11px] opacity-90">
            <input
              type="checkbox"
              checked={autoAdvanceNextString}
              onChange={onToggleAutoAdvance}
              className="rounded w-3.5 h-3.5 accent-emerald-500"
            />
            <span>{t.autoAdvanceLabel}</span>
          </label>
          {tunedStrings.size > 0 && (
            <button
              type="button"
              onClick={onResetTunedStrings}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border transition-colors"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.textSecondary,
              }}
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>
                {tunedStrings.size}/{selectedTuning.strings.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Instrument Preset Tabs + Tuning Variant Dropdown */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar flex-1">
          {INSTRUMENT_PRESETS.map((preset) => {
            const active = preset.id === selectedPreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1"
                style={{
                  backgroundColor: active
                    ? `${theme.accentHex}22`
                    : theme.bgSubtle,
                  borderColor: active ? theme.accentHex : theme.borderPrimary,
                  color: active ? theme.accentHex : theme.textSecondary,
                }}
              >
                <span>{preset.name[lang]}</span>
              </button>
            );
          })}
        </div>

        {selectedPreset.tunings.length > 1 && (
          <select
            value={selectedTuning.id}
            onChange={(e) => {
              const found = selectedPreset.tunings.find(
                (tv) => tv.id === e.target.value
              );
              if (found) onSelectTuning(found);
            }}
            aria-label={t.tuningVariantLabel}
            className="shrink-0 max-w-[130px] sm:max-w-[180px] text-[11px] sm:text-xs rounded-lg px-2 py-1 border focus:outline-none truncate"
            style={{
              backgroundColor: theme.bgSubtle,
              color: theme.textPrimary,
              borderColor: theme.borderPrimary,
            }}
          >
            {selectedPreset.tunings.map((tv) => (
              <option key={tv.id} value={tv.id}>
                {tv.name[lang]}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Row 2: Interactive String Buttons Grid (Compact 3-col on mobile for 6 strings!) */}
      <div
        className={`grid gap-1.5 sm:gap-2 ${
          selectedTuning.strings.length > 8
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 max-h-36 sm:max-h-52 overflow-y-auto pr-1'
            : selectedTuning.strings.length === 2
            ? 'grid-cols-2'
            : selectedTuning.strings.length === 4
            ? 'grid-cols-4'
            : 'grid-cols-3'
        }`}
      >
        {selectedTuning.strings.map((str) => {
          const isCurrentTarget = str.midi === targetMidi;
          const isTuned = tunedStrings.has(str.midi);
          const strLabel = str.label[lang];
          const isGuzhengGreen =
            strLabel.includes('绿') ||
            strLabel.includes('Grn') ||
            strLabel.includes('緑');
          const exactHz = midiToFrequency(str.midi, a4Hz, temperament);

          return (
            <button
              key={`${str.stringNumber}-${str.midi}`}
              type="button"
              onClick={() => onSelectString(str, true)}
              className="string-selector-btn group relative flex flex-col items-start justify-between px-2.5 py-1.5 sm:p-2.5 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: isCurrentTarget
                  ? `${theme.accentHex}22`
                  : isTuned
                  ? `${theme.accentHex}0d`
                  : isGuzhengGreen
                  ? `${theme.accentHex}12`
                  : theme.bgSubtle,
                borderColor: isCurrentTarget
                  ? theme.accentHex
                  : isTuned
                  ? `${theme.accentHex}66`
                  : theme.borderPrimary,
                boxShadow: isCurrentTarget
                  ? `0 0 12px ${theme.accentHex}33`
                  : 'none',
              }}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span
                  className="text-xs sm:text-sm font-bold tracking-tight truncate"
                  style={{
                    color: isCurrentTarget
                      ? theme.accentHex
                      : theme.textPrimary,
                  }}
                >
                  {strLabel}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  {isTuned && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: theme.accentHex }}
                    />
                  )}
                  <Volume2
                    className={`w-3 h-3 transition-opacity ${
                      isCurrentTarget
                        ? 'opacity-90'
                        : 'opacity-40 group-hover:opacity-100'
                    }`}
                    style={{ color: theme.secondaryHex }}
                  />
                </div>
              </div>

              <div className="mt-0.5 sm:mt-1 flex items-center justify-between w-full">
                <span
                  className="font-mono text-[10px] sm:text-[11px] font-semibold"
                  style={{ color: theme.secondaryHex }}
                >
                  {exactHz.toFixed(1)} Hz
                </span>
                {isCurrentTarget && (
                  <span
                    className="text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-bold"
                    style={{
                      backgroundColor: `${theme.accentHex}30`,
                      color: theme.accentHex,
                    }}
                  >
                    {isManualLocked ? t.stringLockedBadge : t.currentStringBadge}
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
          className="px-3 py-1.5 rounded-xl border text-xs font-bold text-center"
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
            className="w-full py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
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
