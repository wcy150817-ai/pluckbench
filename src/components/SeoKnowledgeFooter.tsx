import React, { useState } from 'react';
import { BookOpen, HelpCircle, Shield, FileText, Cpu, Volume2 } from 'lucide-react';

export const SeoKnowledgeFooter: React.FC = () => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <section className="max-w-4xl w-full mx-auto px-3 sm:px-6 pt-8 pb-12 space-y-8 text-slate-300 border-t border-slate-800/80 mt-6">
      {/* Section 1: Acoustic Technology & How Sustain-Lock Works (H2 + H3 for SEO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="p-4 rounded-2xl bg-[#0d121b] border border-slate-800/90 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <h2>三阶段发声包络延音锁定技术</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            吉他、古筝、琵琶与尤克里里在拨弦瞬间（0~120ms 起振瞬态）琴弦张力骤增，会产生偏高 15~30 音分的瞬态频移。TuneKit Pro 采用<strong>起振瞬态过滤 + 黄金延音段能量加权锁定 + 余音保持</strong>算法，杜绝指针乱跳，精准定格琴弦真实基频。
          </p>
        </article>

        <article className="p-4 rounded-2xl bg-[#0d121b] border border-slate-800/90 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Volume2 className="w-4 h-4" />
            <h2>Karplus-Strong 物理建模真实乐器音色</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            告别生硬廉价的电子蜂鸣音。内置物理波导弦振动合成器与多频段木质音板共振峰滤波器（Formant Resonator），针对原声木吉他、21弦古筝、蟒皮二胡、克雷莫纳小提琴与夏威夷尤克里里还原真实拨弦与弓弦揉弦听感。
          </p>
        </article>

        <article className="p-4 rounded-2xl bg-[#0d121b] border border-slate-800/90 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <h2>智能环境噪音监测与硬件级带通降噪</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            实时监测周围环境底噪与非谐波人声干扰。当身处嘈杂排练室或户外时，系统自动弹出降噪提醒，开启后通过动态高通/低通滤波链与谐波周期性门限（NSDF Clarity ≥ 0.72），屏蔽谈话声、空调风扇与桌面杂音。
          </p>
        </article>
      </div>

      {/* Section 2: Standard Instrument Tuning Reference Table */}
      <div className="rounded-2xl bg-[#0d121b] border border-slate-800/90 p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h2>常用中西乐器标准定弦频率速查表 (A4 = 440.0 Hz 标准)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3">乐器名称</th>
                <th className="py-2 px-3">标准定弦音名 (由低到高)</th>
                <th className="py-2 px-3">核心基频范围 (Hz)</th>
                <th className="py-2 pl-3">调音技巧与律制建议</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              <tr>
                <td className="py-2.5 pr-3 font-sans font-semibold text-white">6弦吉他 (Guitar)</td>
                <td className="py-2.5 px-3 text-emerald-400">E2 - A2 - D3 - G3 - B3 - E4</td>
                <td className="py-2.5 px-3">82.41 Hz ~ 329.63 Hz</td>
                <td className="py-2.5 pl-3 font-sans text-slate-400">十二平均律；拨弦后观察 0.3 秒后的稳态延音读数</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-sans font-semibold text-white">尤克里里 (Ukulele)</td>
                <td className="py-2.5 px-3 text-emerald-400">G4 - C4 - E4 - A4 (High-G)</td>
                <td className="py-2.5 px-3">261.63 Hz ~ 440.00 Hz</td>
                <td className="py-2.5 pl-3 font-sans text-slate-400">尼龙弦延音较短，新弦张力易回落需反复校准 2~3 次</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-sans font-semibold text-white">小提琴 (Violin)</td>
                <td className="py-2.5 px-3 text-emerald-400">G3 - D4 - A4 - E5</td>
                <td className="py-2.5 px-3">196.00 Hz ~ 659.26 Hz</td>
                <td className="py-2.5 pl-3 font-sans text-slate-400">先对准 2弦 A4 (440/442Hz)，独奏可切换至五度相生律</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-sans font-semibold text-white">21弦古筝 (D调)</td>
                <td className="py-2.5 px-3 text-emerald-400">D2 - E2 - F#2 - A2(绿) - B2 ... D6</td>
                <td className="py-2.5 px-3">73.42 Hz ~ 1174.66 Hz</td>
                <td className="py-2.5 pl-3 font-sans text-slate-400">优先校准 8弦(A4)、13弦(A3)、18弦(A2)、3弦(A5) 四根绿色标志弦</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-sans font-semibold text-white">二胡 / 琵琶</td>
                <td className="py-2.5 px-3 text-emerald-400">二胡 D4-A4 / 琵琶 A2-D3-E3-A3</td>
                <td className="py-2.5 px-3">110.00 Hz ~ 440.00 Hz</td>
                <td className="py-2.5 pl-3 font-sans text-slate-400">二胡运弓保持平稳长音（避免揉弦）以获得最高测量精度</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Frequently Asked Questions (FAQ) */}
      <div className="rounded-2xl bg-[#0d121b] border border-slate-800/90 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <h2>常见问题解答 (FAQ)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200">
              1. 为什么有些乐器刚拨弦时音高偏高，随后才稳定下来？
            </h3>
            <p className="text-slate-400 leading-relaxed">
              这是弦乐器的物理特性（拨弦瞬态频移 Pitch Chirp）。手指或拨片拉扯琴弦瞬间会短暂增加琴弦张力，导致前 100 毫秒音高偏高。本工具已内置<strong>瞬态过滤与延音锁定算法</strong>，会自动忽略拨弦瞬间的尖峰，直接为您锁定延音段最真实的基频。
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200">
              2. 在琴房、教室或户外环境比较吵的时候怎么准确调音？
            </h3>
            <p className="text-slate-400 leading-relaxed">
              当周围有说话声或风扇杂音时，请点击顶部栏的<strong>「强效抗噪」</strong>按钮（或响应系统的自动降噪提示），同时可切换到底部的<strong>「Tune Manual（手动锁弦）」</strong>模式。这样滤波器将只接收目标琴弦附近的频率，彻底屏蔽环境杂音。
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200">
              3. 如何把这套音乐工具安装到手机桌面离线使用？
            </h3>
            <p className="text-slate-400 leading-relaxed">
              本站支持全平台 PWA 标准。iOS 用户在 Safari 点击底部分享按钮选择「添加到主屏幕」，Android 与电脑 Chrome/Edge 用户点击地址栏右侧的「安装应用」图标，即可像原生 App 一样全屏无网络打开使用。
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200">
              4. 麦克风音频数据会上传到服务器吗？
            </h3>
            <p className="text-slate-400 leading-relaxed">
              绝不上传。所有音频频谱计算、NSDF 基频提取与分贝检测均 100% 在您设备本地浏览器的 Web Audio API 内存中实时完成，零延迟且完全保护您的隐私安全。
            </p>
          </div>
        </div>
      </div>

      {/* Footer Bar with Legal Links */}
      <footer className="pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} TuneKit Pro — 全平台在线音乐工具工作台 (调音器 · 节拍器 · 和弦库 · 练耳 · 分贝仪). All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="hover:text-slate-300 flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>隐私政策 (Privacy Policy)</span>
          </button>
          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="hover:text-slate-300 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>服务条款 (Terms of Service)</span>
          </button>
        </div>
      </footer>

      {/* Legal Modal (Privacy / Terms) */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-lg w-full rounded-2xl bg-[#0e1420] border border-slate-700 p-6 space-y-4 text-xs text-slate-300">
            <h3 className="text-base font-bold text-white">
              {legalModal === 'privacy'
                ? '隐私政策 (Privacy Policy)'
                : '服务条款 (Terms of Service)'}
            </h3>
            {legalModal === 'privacy' ? (
              <div className="space-y-2 leading-relaxed text-slate-400">
                <p>
                  <strong>1. 本地音频处理：</strong>
                  TuneKit Pro 请求的麦克风权限仅用于在您的浏览器本地通过 Web Audio API 实时计算乐器音频频率与环境声压。我们不会录制、存储或向任何外部服务器传输您的音频流。
                </p>
                <p>
                  <strong>2. 本地偏好存储：</strong>
                  您设置的 A4 基准频率、律制与降噪参数仅保存在您的浏览器本地存储中，随时可重置。
                </p>
              </div>
            ) : (
              <div className="space-y-2 leading-relaxed text-slate-400">
                <p>
                  <strong>1. 免费工具许可：</strong>
                  TuneKit Pro 提供的在线乐器调音器、节拍器、和弦库、练耳训练与声学分贝仪供全球音乐学习者、乐手与教育工作者免费使用。
                </p>
                <p>
                  <strong>2. 使用提示：</strong>
                  在给高张力琴弦（如古筝细弦、吉他1弦、小提琴E弦）调音时，请对照目标赫兹频率缓慢拧动弦轴，避免过度拧紧导致断弦。
                </p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
