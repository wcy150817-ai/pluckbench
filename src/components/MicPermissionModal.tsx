import React from 'react';
import {
  ThemePalette,
  SupportedLang,
  GeoRegionCode,
  UI_TEXT,
} from '../i18n/localeTheme';
import {
  Mic,
  ShieldCheck,
  Radio,
  Volume2,
  AlertTriangle,
  X,
  Globe,
} from 'lucide-react';

interface MicPermissionModalProps {
  isOpen: boolean;
  hasError: boolean;
  errorDetail?: string | null;
  theme: ThemePalette;
  lang: SupportedLang;
  region: GeoRegionCode;
  onChangeRegion: (reg: GeoRegionCode) => void;
  onAllowMic: () => void;
  onUseReferenceTone: () => void;
  onClose: () => void;
}

export const MicPermissionModal: React.FC<MicPermissionModalProps> = ({
  isOpen,
  hasError,
  errorDetail,
  theme,
  lang,
  onChangeRegion,
  onAllowMic,
  onUseReferenceTone,
  onClose,
}) => {
  if (!isOpen) return null;

  const t = UI_TEXT[lang];

  const langOptions: { label: string; langCode: SupportedLang; targetRegion: GeoRegionCode }[] = [
    { label: '中文', langCode: 'zh', targetRegion: 'CN' },
    { label: 'English', langCode: 'en', targetRegion: 'US' },
    { label: '日本語', langCode: 'ja', targetRegion: 'JP' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-permission-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border shadow-2xl p-4 sm:p-6 space-y-4 transition-all"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: hasError ? theme.dangerHex : theme.borderPrimary,
          color: theme.textPrimary,
        }}
      >
        {/* Top Row: Badge + Quick Language Switcher + Close Button */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
            style={{
              backgroundColor: hasError
                ? `${theme.dangerHex}20`
                : `${theme.accentHex}20`,
              borderColor: hasError ? theme.dangerHex : `${theme.accentHex}66`,
              color: hasError ? theme.dangerHex : theme.accentHex,
            }}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t.micModalBadge}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Quick Language Switcher Pill inside Modal */}
            <div
              className="flex items-center rounded-lg border p-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
              }}
            >
              <Globe
                className="w-3 h-3 mx-1 shrink-0"
                style={{ color: theme.textSecondary }}
              />
              {langOptions.map((opt) => {
                const active = lang === opt.langCode;
                return (
                  <button
                    key={opt.langCode}
                    type="button"
                    onClick={() => onChangeRegion(opt.targetRegion)}
                    className="px-1.5 py-0.5 rounded-md transition-colors"
                    style={{
                      backgroundColor: active ? theme.accentHex : 'transparent',
                      color: active ? '#ffffff' : theme.textSecondary,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border transition-colors"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.textSecondary,
              }}
              aria-label={t.micModalLaterBtn}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Icon + Title + Description */}
        <div className="space-y-2">
          <h2
            id="mic-permission-modal-title"
            className="text-base sm:text-lg font-extrabold leading-snug"
          >
            {hasError ? t.micModalErrorTitle : t.micModalTitle}
          </h2>
          <p
            className="text-xs sm:text-sm leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            {t.micModalDesc}
          </p>
        </div>

        {/* Error / Blocked Troubleshooting Box (shown if browser denied or failed mic access) */}
        {hasError && (
          <div
            className="rounded-xl border p-3.5 space-y-2 text-xs leading-relaxed"
            style={{
              backgroundColor: `${theme.dangerHex}15`,
              borderColor: theme.dangerHex,
              color: theme.textPrimary,
            }}
          >
            <div
              className="flex items-center gap-1.5 font-bold"
              style={{ color: theme.dangerHex }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t.micModalErrorTitle}</span>
            </div>
            <p style={{ color: theme.textSecondary }}>{t.micModalErrorSteps}</p>
            {errorDetail && (
              <div
                className="font-mono text-[11px] opacity-75 pt-0.5"
                style={{ color: theme.textMuted }}
              >
                {errorDetail}
              </div>
            )}
          </div>
        )}

        {/* Feature & Privacy Reassurance Cards */}
        <div className="space-y-2.5">
          <div
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{
              backgroundColor: theme.bgSubtle,
              borderColor: theme.borderPrimary,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: `${theme.accentHex}22`,
                color: theme.accentHex,
              }}
            >
              <Radio className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold">{t.micModalPoint1Title}</div>
              <div style={{ color: theme.textSecondary }}>
                {t.micModalPoint1Desc}
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{
              backgroundColor: theme.bgSubtle,
              borderColor: theme.borderPrimary,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: `${theme.secondaryHex}22`,
                color: theme.secondaryHex,
              }}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold">{t.micModalPoint2Title}</div>
              <div style={{ color: theme.textSecondary }}>
                {t.micModalPoint2Desc}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            id="mic-modal-allow-btn"
            type="button"
            onClick={onAllowMic}
            className="w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
            style={{
              backgroundColor: theme.accentHex,
            }}
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>{hasError ? t.micModalRetryBtn : t.micModalAllowBtn}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="mic-modal-sound-btn"
              type="button"
              onClick={onUseReferenceTone}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-colors"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.textPrimary,
              }}
            >
              <Volume2
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: theme.warnHex }}
              />
              <span className="truncate">{t.micModalSoundOnlyBtn}</span>
            </button>

            <button
              id="mic-modal-later-btn"
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs border flex items-center justify-center transition-colors"
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.borderPrimary,
                color: theme.textSecondary,
              }}
            >
              {t.micModalLaterBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
