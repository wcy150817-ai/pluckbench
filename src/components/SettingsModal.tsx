import React from 'react';
import {
  TEMPERAMENTS,
  TIMBRE_OPTIONS,
  TemperamentId,
  NotationStyle,
  ToneWaveform,
} from '../data/instruments';
import { ThemePalette, SupportedLang, UI_TEXT } from '../i18n/localeTheme';
import { X, Sliders, Volume2, Activity, RotateCcw, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  a4Hz: number;
  onChangeA4Hz: (val: number) => void;
  temperament: TemperamentId;
  onChangeTemperament: (val: TemperamentId) => void;
  notationStyle: NotationStyle;
  onChangeNotationStyle: (val: NotationStyle) => void;
  dampingMode: 'fast' | 'balanced' | 'smooth';
  onChangeDampingMode: (val: 'fast' | 'balanced' | 'smooth') => void;
  noiseGateDb: number;
  onChangeNoiseGateDb: (val: number) => void;
  deepNoiseSuppression: boolean;
  onChangeDeepNoiseSuppression: (val: boolean) => void;
  waveform: ToneWaveform;
  onChangeWaveform: (val: ToneWaveform) => void;
  toneVolume: number;
  onChangeToneVolume: (val: number) => void;
  showPitchTrail: boolean;
  onChangeShowPitchTrail: (val: boolean) => void;
  enableLockChime: boolean;
  onChangeEnableLockChime: (val: boolean) => void;
  onResetDefaults: () => void;
  theme: ThemePalette;
  lang: SupportedLang;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  a4Hz,
  onChangeA4Hz,
  temperament,
  onChangeTemperament,
  notationStyle,
  onChangeNotationStyle,
  dampingMode,
  onChangeDampingMode,
  noiseGateDb,
  onChangeNoiseGateDb,
  deepNoiseSuppression,
  onChangeDeepNoiseSuppression,
  waveform,
  onChangeWaveform,
  toneVolume,
  onChangeToneVolume,
  showPitchTrail,
  onChangeShowPitchTrail,
  enableLockChime,
  onChangeEnableLockChime,
  onResetDefaults,
  theme,
  lang,
}) => {
  if (!isOpen) return null;

  const t = UI_TEXT[lang];
  const a4Presets = [415, 432, 440, 442, 444];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-4 sm:p-6 space-y-5"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: theme.borderPrimary }}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5" style={{ color: theme.accentHex }} />
            <h2 className="text-base sm:text-lg font-bold">{t.settingsTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: theme.textSecondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Deep Noise Suppression & Microphone Sensitivity */}
        <div
          className="p-3.5 rounded-xl border space-y-3"
          style={{
            backgroundColor: theme.bgSubtle,
            borderColor: theme.borderPrimary,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{ color: theme.accentHex }}
              />
              <div>
                <div className="text-xs sm:text-sm font-bold">
                  {t.noiseSectionTitle}
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: theme.textSecondary }}
                >
                  {t.noiseSectionDesc}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChangeDeepNoiseSuppression(!deepNoiseSuppression)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border transition-all"
              style={{
                backgroundColor: deepNoiseSuppression
                  ? theme.accentHex
                  : theme.bgCard,
                color: deepNoiseSuppression ? '#ffffff' : theme.textPrimary,
                borderColor: deepNoiseSuppression
                  ? theme.accentHex
                  : theme.borderPrimary,
              }}
            >
              {deepNoiseSuppression ? t.noiseBtnOn : t.noiseBtnOff}
            </button>
          </div>

          <div
            className="space-y-1.5 pt-2 border-t"
            style={{ borderColor: theme.borderPrimary }}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <Activity
                  className="w-3.5 h-3.5"
                  style={{ color: theme.secondaryHex }}
                />
                <span>{t.noiseGateLabel}</span>
              </label>
              <span
                className="font-mono text-xs"
                style={{ color: theme.secondaryHex }}
              >
                {noiseGateDb} dB (
                {noiseGateDb <= -56
                  ? t.noiseGateQuiet
                  : noiseGateDb >= -42
                  ? t.noiseGateNoisy
                  : t.noiseGateNormal}
                )
              </span>
            </div>
            <input
              type="range"
              min={-65}
              max={-30}
              step={1}
              value={noiseGateDb}
              onChange={(e) => onChangeNoiseGateDb(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Realistic Physical Instrument Timbre Selector */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" style={{ color: theme.accentHex }} />
              <span>{t.timbreSectionTitle}</span>
            </label>
            <span
              className="font-mono text-xs"
              style={{ color: theme.accentHex }}
            >
              {t.volumeLabel} {Math.round(toneVolume * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {TIMBRE_OPTIONS.map((w) => {
              const active = waveform === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onChangeWaveform(w.id)}
                  className="p-2 rounded-xl text-left border transition-all"
                  style={{
                    backgroundColor: active
                      ? `${theme.accentHex}22`
                      : theme.bgSubtle,
                    borderColor: active ? theme.accentHex : theme.borderPrimary,
                    color: active ? theme.accentHex : theme.textPrimary,
                  }}
                >
                  <div className="text-xs font-bold truncate">
                    {w.name[lang]}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: theme.textSecondary }}
                  >
                    {w.badge[lang]}
                  </div>
                </button>
              );
            })}
          </div>

          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={toneVolume}
            onChange={(e) => onChangeToneVolume(Number(e.target.value))}
            className="w-full cursor-pointer"
          />
        </div>

        {/* 3. A4 Reference Pitch Calibration */}
        <div
          className="space-y-2.5 pt-2 border-t"
          style={{ borderColor: theme.borderPrimary }}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold">
              {t.a4SectionTitle}
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeA4Hz(Math.max(410, a4Hz - 1))}
                className="px-2 py-0.5 rounded border text-xs font-mono"
                style={{
                  backgroundColor: theme.bgSubtle,
                  borderColor: theme.borderPrimary,
                }}
              >
                -1
              </button>
              <span
                className="font-mono text-sm font-bold px-2"
                style={{ color: theme.accentHex }}
              >
                {a4Hz} Hz
              </span>
              <button
                type="button"
                onClick={() => onChangeA4Hz(Math.min(470, a4Hz + 1))}
                className="px-2 py-0.5 rounded border text-xs font-mono"
                style={{
                  backgroundColor: theme.bgSubtle,
                  borderColor: theme.borderPrimary,
                }}
              >
                +1
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {a4Presets.map((hz) => (
              <button
                key={hz}
                type="button"
                onClick={() => onChangeA4Hz(hz)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors"
                style={{
                  backgroundColor:
                    a4Hz === hz ? `${theme.accentHex}22` : theme.bgSubtle,
                  borderColor:
                    a4Hz === hz ? theme.accentHex : theme.borderPrimary,
                  color: a4Hz === hz ? theme.accentHex : theme.textSecondary,
                }}
              >
                {hz} Hz
              </button>
            ))}
          </div>
        </div>

        {/* 4. Musical Temperament */}
        <div
          className="space-y-2 pt-2 border-t"
          style={{ borderColor: theme.borderPrimary }}
        >
          <label className="text-xs sm:text-sm font-semibold block">
            {t.temperamentSectionTitle}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPERAMENTS.map((temp) => {
              const active = temperament === temp.id;
              return (
                <button
                  key={temp.id}
                  type="button"
                  onClick={() => onChangeTemperament(temp.id)}
                  className="p-2.5 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: active
                      ? `${theme.accentHex}20`
                      : theme.bgSubtle,
                    borderColor: active ? theme.accentHex : theme.borderPrimary,
                  }}
                >
                  <div className="text-xs font-bold">{temp.name[lang]}</div>
                  <div
                    className="text-[11px] mt-0.5 leading-snug"
                    style={{ color: theme.textSecondary }}
                  >
                    {temp.desc[lang]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Notation & Needle Damping */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t"
          style={{ borderColor: theme.borderPrimary }}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">
              {t.notationSectionTitle}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'letter', label: t.notationLetter },
                { id: 'solfege', label: t.notationSolfege },
                { id: 'numbered', label: t.notationNumbered },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onChangeNotationStyle(item.id as NotationStyle)
                  }
                  className="py-1.5 px-2 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor:
                      notationStyle === item.id
                        ? `${theme.secondaryHex}22`
                        : theme.bgSubtle,
                    borderColor:
                      notationStyle === item.id
                        ? theme.secondaryHex
                        : theme.borderPrimary,
                    color:
                      notationStyle === item.id
                        ? theme.secondaryHex
                        : theme.textSecondary,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold block">
              {t.dampingSectionTitle}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'fast', label: t.dampingFast },
                { id: 'balanced', label: t.dampingBalanced },
                { id: 'smooth', label: t.dampingSmooth },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onChangeDampingMode(
                      item.id as 'fast' | 'balanced' | 'smooth'
                    )
                  }
                  className="py-1.5 px-2 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor:
                      dampingMode === item.id
                        ? `${theme.accentHex}22`
                        : theme.bgSubtle,
                    borderColor:
                      dampingMode === item.id
                        ? theme.accentHex
                        : theme.borderPrimary,
                    color:
                      dampingMode === item.id
                        ? theme.accentHex
                        : theme.textSecondary,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Visual & Audio Aids Toggles */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t"
          style={{ borderColor: theme.borderPrimary }}
        >
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showPitchTrail}
              onChange={(e) => onChangeShowPitchTrail(e.target.checked)}
              className="rounded w-4 h-4"
            />
            <span>{t.trailToggleLabel}</span>
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={enableLockChime}
              onChange={(e) => onChangeEnableLockChime(e.target.checked)}
              className="rounded w-4 h-4"
            />
            <span>{t.chimeToggleLabel}</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: theme.borderPrimary }}
        >
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
            style={{
              backgroundColor: theme.bgSubtle,
              borderColor: theme.borderPrimary,
              color: theme.textSecondary,
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDefaultsBtn}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: theme.accentHex }}
          >
            {t.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
