import React from 'react';
import {
  TEMPERAMENTS,
  TemperamentId,
  NotationStyle,
  ToneWaveform,
} from '../data/instruments';
import { X, Sliders, Volume2, Activity, RotateCcw } from 'lucide-react';

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
  waveform: ToneWaveform;
  onChangeWaveform: (val: ToneWaveform) => void;
  toneVolume: number;
  onChangeToneVolume: (val: number) => void;
  showPitchTrail: boolean;
  onChangeShowPitchTrail: (val: boolean) => void;
  enableLockChime: boolean;
  onChangeEnableLockChime: (val: boolean) => void;
  onResetDefaults: () => void;
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
  waveform,
  onChangeWaveform,
  toneVolume,
  onChangeToneVolume,
  showPitchTrail,
  onChangeShowPitchTrail,
  enableLockChime,
  onChangeEnableLockChime,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const a4Presets = [
    { hz: 415, label: '415Hz 巴洛克' },
    { hz: 432, label: '432Hz 古典温和' },
    { hz: 440, label: '440Hz 国际标准' },
    { hz: 442, label: '442Hz 交响/民乐团' },
    { hz: 444, label: '444Hz 高亮管弦' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e1420] border border-slate-700/80 shadow-2xl text-slate-100 p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold">
              gStrings Pro 专业调音设置
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. A4 Reference Pitch Calibration */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-slate-200">
              A4 标准音基准频率 (Concert Pitch)
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeA4Hz(Math.max(410, a4Hz - 1))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono"
              >
                -1
              </button>
              <span className="font-mono text-sm font-bold text-emerald-400 px-2">
                {a4Hz} Hz
              </span>
              <button
                type="button"
                onClick={() => onChangeA4Hz(Math.min(470, a4Hz + 1))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono"
              >
                +1
              </button>
            </div>
          </div>

          <input
            type="range"
            min={410}
            max={470}
            step={1}
            value={a4Hz}
            onChange={(e) => onChangeA4Hz(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex flex-wrap gap-1.5">
            {a4Presets.map((p) => (
              <button
                key={p.hz}
                type="button"
                onClick={() => onChangeA4Hz(p.hz)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  a4Hz === p.hz
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Musical Temperament (律制) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-xs sm:text-sm font-semibold text-slate-200 block">
            律制系统 (Musical Temperament)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPERAMENTS.map((t) => {
              const active = temperament === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTemperament(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-xs font-bold">{t.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Notation & Needle Damping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              音名显示方式
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'letter', label: 'C D E 音名' },
                { id: 'solfege', label: 'Do Re Mi' },
                { id: 'numbered', label: '1 2 3 简谱' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onChangeNotationStyle(item.id as NotationStyle)
                  }
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                    notationStyle === item.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              表盘指针阻尼感 (Needle Damping)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'fast', label: '极速响应' },
                { id: 'balanced', label: '经典均衡' },
                { id: 'smooth', label: '高阻尼丝滑' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onChangeDampingMode(
                      item.id as 'fast' | 'balanced' | 'smooth'
                    )
                  }
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                    dampingMode === item.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Microphone Sensitivity / Noise Gate */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>麦克风环境降噪门限 (Noise Gate)</span>
            </label>
            <span className="font-mono text-xs text-sky-400">
              {noiseGateDb} dB ({noiseGateDb <= -58 ? '高灵敏度' : noiseGateDb >= -42 ? '嘈杂抗噪' : '标准环境'})
            </span>
          </div>
          <input
            type="range"
            min={-68}
            max={-32}
            step={1}
            value={noiseGateDb}
            onChange={(e) => onChangeNoiseGateDb(Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>安静房间 / 微弱余音 (-68dB)</span>
            <span>标准 (-52dB)</span>
            <span>嘈杂排练室过滤杂音 (-32dB)</span>
          </div>
        </div>

        {/* 5. Sound It Reference Tone Generator Settings */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sound It 基准发音音色与音量</span>
            </label>
            <span className="font-mono text-xs text-emerald-400">
              {Math.round(toneVolume * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'plucked', label: '琴弦泛音' },
              { id: 'sine', label: '纯正弦波' },
              { id: 'triangle', label: '温暖三角波' },
              { id: 'organ', label: '管风琴持续音' },
            ].map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onChangeWaveform(w.id as ToneWaveform)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                  waveform === w.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={toneVolume}
            onChange={(e) => onChangeToneVolume(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* 6. Visual & Audio Aids Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showPitchTrail}
              onChange={(e) => onChangeShowPitchTrail(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span>显示表盘音高稳定度轨迹线</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enableLockChime}
              onChange={(e) => onChangeEnableLockChime(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span>琴弦音准锁定后播放清脆提示音</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复出厂默认</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
          >
            完成并应用
          </button>
        </div>
      </div>
    </div>
  );
};
