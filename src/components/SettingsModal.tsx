import React from 'react';
import {
  TEMPERAMENTS,
  TIMBRE_OPTIONS,
  TemperamentId,
  NotationStyle,
  ToneWaveform,
} from '../data/instruments';
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
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e1420] border border-slate-700/80 shadow-2xl text-slate-100 p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold">
              TuneKit Pro 专业声学与降噪设置
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

        {/* 1. Deep Noise Suppression & Microphone Sensitivity */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-100">
                  强效硬件级带通降噪 + 谐波人声过滤
                </div>
                <div className="text-[11px] text-slate-400">
                  开启后将根据当前乐器音域自动收窄带通滤波器，过滤外界交谈、风扇与杂音
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChangeDeepNoiseSuppression(!deepNoiseSuppression)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border transition-all ${
                deepNoiseSuppression
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {deepNoiseSuppression ? '已开启强效降噪' : '点击开启'}
            </button>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>麦克风拾音门限 (Noise Gate)</span>
              </label>
              <span className="font-mono text-xs text-sky-400">
                {noiseGateDb} dB (
                {noiseGateDb <= -56
                  ? '安静室内'
                  : noiseGateDb >= -42
                  ? '强抗噪模式'
                  : '均衡防抖'}
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
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>安静房间 (-65dB)</span>
              <span>推荐均衡 (-50dB)</span>
              <span>嘈杂户外/琴房过滤杂音 (-30dB)</span>
            </div>
          </div>
        </div>

        {/* 2. Realistic Physical Instrument Timbre Selector */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>真实乐器物理建模音色 (Karplus-Strong & 共振峰合成)</span>
            </label>
            <span className="font-mono text-xs text-emerald-400">
              音量 {Math.round(toneVolume * 100)}%
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
                  className={`p-2 rounded-xl text-left border transition-all ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/60'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{w.name}</div>
                  <div className="text-[10px] text-slate-400">{w.badge}</div>
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
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* 3. A4 Reference Pitch Calibration */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
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

        {/* 4. Musical Temperament (律制) */}
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

        {/* 5. Notation & Needle Damping */}
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
              表盘指针阻尼感 (防抖平顺度)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'fast', label: '灵敏跟踪' },
                { id: 'balanced', label: '稳态均衡' },
                { id: 'smooth', label: '重阻尼防抖' },
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

        {/* 6. Visual & Audio Aids Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showPitchTrail}
              onChange={(e) => onChangeShowPitchTrail(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span>显示表盘延音稳定度轨迹线</span>
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
