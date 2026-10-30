import React, { useState } from 'react';
import { ThemePalette, SupportedLang } from '../i18n/localeTheme';
import { BookOpen, HelpCircle, Shield, FileText, Cpu, Volume2 } from 'lucide-react';

const FOOTER_CONTENT: Record<
  SupportedLang,
  {
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    card3Title: string;
    card3Desc: string;
    tableTitle: string;
    thInst: string;
    thNotes: string;
    thRange: string;
    thTip: string;
    rows: { inst: string; notes: string; range: string; tip: string }[];
    faqTitle: string;
    faqs: { q: string; a: string }[];
    copyright: string;
    privacyBtn: string;
    termsBtn: string;
    privacyText1: string;
    privacyText2: string;
    termsText1: string;
    termsText2: string;
    closeBtn: string;
  }
> = {
  zh: {
    card1Title: '在线乐器调音器：三阶段发声包络延音锁定技术',
    card1Desc:
      '吉他、古筝、琵琶与尤克里里在拨弦瞬间（起振瞬态）琴弦张力骤增，会产生偏高 15~30 音分的瞬态频移。音律工坊在线乐器调音器采用起振瞬态过滤 + 黄金延音段能量加权锁定 + 余音保持算法，杜绝指针乱晃，精准锁定琴弦真实基频。',
    card2Title: '物理建模真实乐器原声合成参考音',
    card2Desc:
      '告别生硬廉价的电子蜂鸣音。本在线乐器调音器内置物理波导弦振动合成器与多频段木质音板共振峰滤波器，针对原声木吉他、21弦古筝、蟒皮二胡、小提琴与夏威夷尤克里里还原真实拨弦与弓弦听感。',
    card3Title: '智能环境噪音监测与窄带滤波降噪',
    card3Desc:
      '实时监测周围环境底噪与人声干扰。当身处嘈杂琴房或户外使用在线乐器调音器时，先选定目标琴弦并开启强效降噪，系统将自动收窄带通滤波器至该琴弦基频附近，彻底屏蔽谈话声、空调与风扇杂音。',
    tableTitle: '在线乐器调音器：常用中西乐器标准定弦频率速查表 (A4 = 440.0 Hz)',
    thInst: '乐器名称',
    thNotes: '标准定弦音名 (由低到高)',
    thRange: '核心基频范围 (Hz)',
    thTip: '调音技巧与律制建议',
    rows: [
      {
        inst: '六弦吉他',
        notes: 'E2 - A2 - D3 - G3 - B3 - E4',
        range: '82.41 Hz ~ 329.63 Hz',
        tip: '先选定目标弦再拨弦；在 ±5 音分合格区稳定保持即可听见完成提示音',
      },
      {
        inst: '尤克里里',
        notes: 'G4 - C4 - E4 - A4',
        range: '261.63 Hz ~ 440.00 Hz',
        tip: '尼龙弦延音较短，新弦张力易回落，建议反复校准两到三次',
      },
      {
        inst: '小提琴',
        notes: 'G3 - D4 - A4 - E5',
        range: '196.00 Hz ~ 659.26 Hz',
        tip: '先对准 2 弦 A4，独奏可切换至五度相生律获得纯净五度共鸣',
      },
      {
        inst: '二十一弦古筝 (D调)',
        notes: 'D2 - E2 - F#2 - A2(绿) - B2 ... D6',
        range: '73.42 Hz ~ 1174.66 Hz',
        tip: '优先校准 8弦(A4)、13弦(A3)、18弦(A2)、3弦(A5) 四根绿色标志弦',
      },
      {
        inst: '二胡 / 琵琶',
        notes: 'D4 - A4 / A2 - D3 - E3 - A3',
        range: '110.00 Hz ~ 440.00 Hz',
        tip: '二胡运弓保持平稳长音（避免揉弦）以获得最高测量精度',
      },
    ],
    faqTitle: '在线乐器调音器常见问题解答',
    faqs: [
      {
        q: '1. 为什么使用在线乐器调音器要先选定哪根弦再调音？',
        a: '先点击选定要调的琴弦后，在线乐器调音器会将带通滤波器精准锁定在该琴弦的频率窗口，不仅能彻底防止相邻琴弦共鸣或外界说话声导致跳弦，还能在音准稳定后自动播放清脆的完成提示音。',
      },
      {
        q: '2. 为什么有些乐器刚拨弦时音高偏高，随后才稳定？',
        a: '这是弦乐器的物理特性。手指或拨片拉扯琴弦瞬间会短暂增加张力，导致前 100 毫秒音高偏高。本在线乐器调音器内置瞬态过滤与延音锁定算法，会自动忽略拨弦瞬间的尖峰，直接锁定延音段最真实的基频。',
      },
      {
        q: '3. 在琴房或户外环境比较吵的时候怎么准确调音？',
        a: '请先点击选定要调的琴弦，然后开启顶部栏的「强效降噪」按钮。此时滤波器仅允许目标琴弦附近的窄带频率通过，可大幅屏蔽周围交谈声与环境底噪。',
      },
      {
        q: '4. 麦克风音频数据会上传到服务器吗？',
        a: '绝不上传。所有音频频谱计算、基频提取与分贝检测均 100% 在您设备本地浏览器的内存中实时完成，零延迟且完全保护您的隐私安全。',
      },
    ],
    copyright: '© 2026 音律工坊 专业版 — 全平台在线乐器调音器与音乐工具箱（调音器 · 节拍器 · 和弦库 · 练耳 · 分贝仪）',
    privacyBtn: '隐私政策',
    termsBtn: '服务条款',
    privacyText1:
      '1. 本地音频处理：本工具请求的麦克风权限仅用于在您的浏览器本地实时计算乐器音频频率与环境声压，绝不录制、存储或向任何外部服务器传输音频数据。',
    privacyText2:
      '2. 本地偏好存储：您设置的基准频率、律制、降噪开关与日夜配色仅保存在您的设备本地存储中。',
    termsText1:
      '1. 免费工具许可：本在线乐器调音器、节拍器、和弦库、练耳训练与分贝仪供音乐学习者、乐手与教育工作者免费使用。',
    termsText2:
      '2. 调弦安全提示：在给高张力细弦（如古筝高音弦、吉他1弦、小提琴E弦）调音时，请对照目标赫兹频率缓慢拧动弦轴，避免过度拧紧导致断弦。',
    closeBtn: '关闭',
  },
  en: {
    card1Title: 'Online Instrument Tuner: 3-Stage Sustain-Lock Engine',
    card1Desc:
      'Plucked strings exhibit a +15 to +30 cent pitch chirp during the first 100ms attack transient. Our online instrument tuner filters out attack transients, weights the golden sustain plateau, and uses an overdamped fluid needle to lock onto the true fundamental pitch without jitter.',
    card2Title: 'Karplus-Strong Physical Modeling Reference Tones',
    card2Desc:
      'No cheap electronic buzzers. Built into this online instrument tuner are waveguide string synthesis and multi-band wood body formant resonators that reproduce authentic acoustic guitar, concert zither, violin, erhu, and ukulele reference tones.',
    card3Title: 'Narrow-Band Hardware Noise Suppression',
    card3Desc:
      'Select your target string first and enable the Noise Filter in noisy rooms. The online instrument tuner audio engine automatically narrows its bandpass filter around that specific string frequency to reject background chatter and room noise.',
    tableTitle: 'Online Instrument Tuner Frequency Reference Chart (A4 = 440.0 Hz)',
    thInst: 'Instrument',
    thNotes: 'Standard String Notes (Low to High)',
    thRange: 'Fundamental Range (Hz)',
    thTip: 'Tuning Workflow & Temperament Tip',
    rows: [
      {
        inst: '6-String Guitar',
        notes: 'E2 - A2 - D3 - G3 - B3 - E4',
        range: '82.41 Hz – 329.63 Hz',
        tip: 'Select target string first; hold inside the ±5¢ zone for confirmation chime',
      },
      {
        inst: 'Ukulele',
        notes: 'G4 - C4 - E4 - A4 (High-G)',
        range: '261.63 Hz – 440.00 Hz',
        tip: 'Nylon strings stretch quickly when new; re-verify tuning 2–3 times',
      },
      {
        inst: 'Violin',
        notes: 'G3 - D4 - A4 - E5',
        range: '196.00 Hz – 659.26 Hz',
        tip: 'Tune 2nd string A4 first; switch to Pythagorean temperament for solo fifths',
      },
      {
        inst: '21-String Guzheng (D)',
        notes: 'D2 - E2 - F#2 - A2 - B2 ... D6',
        range: '73.42 Hz – 1174.66 Hz',
        tip: 'Calibrate green marker strings #8 (A4), #13 (A3), #18 (A2), and #3 (A5) first',
      },
      {
        inst: '4-String Bass',
        notes: 'E1 - A1 - D2 - G2',
        range: '41.20 Hz – 98.00 Hz',
        tip: 'Pluck gently near the neck pickup for clearer fundamental harmonic',
      },
    ],
    faqTitle: 'Online Instrument Tuner Frequently Asked Questions (FAQ)',
    faqs: [
      {
        q: '1. Why should I select the target string first on this online instrument tuner?',
        a: 'Selecting your target string locks the online instrument tuner bandpass filter directly around that string’s frequency window. It prevents sympathetic string vibration or room chatter from jumping to another note, and plays a confirmation chime once held steady within ±5 cents.',
      },
      {
        q: '2. Why does a plucked string read sharp at first and then settle?',
        a: 'When a pick or finger pulls a string, the instantaneous increase in tension causes a brief pitch chirp during the first 100 milliseconds. Our sustain-lock algorithm ignores the initial attack spike and locks onto the true sustain pitch.',
      },
      {
        q: '3. How can I tune accurately in a noisy practice room or outdoors?',
        a: 'Tap the string you want to tune and enable the "Noise Filter" button in the top bar of the online instrument tuner. This activates a narrow-band hardware filter centered on that single string.',
      },
      {
        q: '4. Is my microphone audio ever recorded or uploaded?',
        a: 'Never. All pitch detection, FFT spectrum analysis, and decibel measurements run 100% locally inside your browser via the Web Audio API with zero network transmission.',
      },
    ],
    copyright: '© 2026 PluckBench Pro — Free Online Instrument Tuner & Cross-Platform Music Workbench (Tuner · Metronome · Chords · Ear Trainer · dB Meter)',
    privacyBtn: 'Privacy Policy',
    termsBtn: 'Terms of Service',
    privacyText1:
      '1. Local Audio Processing: Microphone access is used exclusively inside your browser via Web Audio API to calculate pitch frequency and sound pressure level in real time. Audio is never recorded, stored, or transmitted to any server.',
    privacyText2:
      '2. Local Preferences: Your A4 calibration, temperament, noise filter, and light/dark theme settings are stored locally on your device.',
    termsText1:
      '1. Free Usage License: PluckBench Pro provides its instrument tuner, metronome, chord library, ear trainer, and decibel meter free of charge for musicians, students, and educators.',
    termsText2:
      '2. String Safety Notice: When tuning high-tension treble strings, turn tuning pegs gradually while watching the Hz readout to avoid over-tightening and string breakage.',
    closeBtn: 'Close',
  },
  ja: {
    card1Title: '3段階エンベロープ・サステインロック技術',
    card1Desc:
      '弦を弾いた直後の約100ミリ秒間は張変化によりピッチが一時的に15〜30セント上ずります。音律工房はアタック過渡期を除外し、安定したサステイン区間のみを加重平均することで、針の乱れを防ぎ正確な基音をロックします。',
    card2Title: '物理モデリングによるリアル楽器音合成',
    card2Desc:
      '単調な電子ビープ音ではなく、Karplus-Strong弦振動合成と木製ボディ共鳴フィルターにより、アコースティックギター・古筝・二胡・バイオリン・ウクレレの自然な響きを再現します。',
    card3Title: '環境騒音検知と狭帯域ノイズ除去フィルター',
    card3Desc:
      '最初に調律する弦を選択して「ノイズ除去」をONにすると、その弦の周波数帯のみを通過させる狭帯域フィルターが作動し、周囲の会話や空調ノイズを強力に遮断します。',
    tableTitle: '主要楽器の標準チューニング周波数一覧表 (A4 = 440.0 Hz)',
    thInst: '楽器名',
    thNotes: '標準調弦ノート (低音〜高音)',
    thRange: '基本周波数帯域 (Hz)',
    thTip: 'チューニングのコツと音律設定',
    rows: [
      {
        inst: '6弦ギター',
        notes: 'E2 - A2 - D3 - G3 - B3 - E4',
        range: '82.41 Hz ～ 329.63 Hz',
        tip: '先に弦をタップして固定し、±5¢圏内で安定保持すると完了音が鳴ります',
      },
      {
        inst: 'ウクレレ',
        notes: 'G4 - C4 - E4 - A4 (High-G)',
        range: '261.63 Hz ～ 440.00 Hz',
        tip: 'ナイロン弦は伸びやすいため、2〜3回繰り返して微調整してください',
      },
      {
        inst: 'バイオリン',
        notes: 'G3 - D4 - A4 - E5',
        range: '196.00 Hz ～ 659.26 Hz',
        tip: 'まず第2弦 A4 を合わせ、独奏ではピタゴラス音律への切替も推奨されます',
      },
      {
        inst: '21弦古筝 (D調)',
        notes: 'D2 - E2 - F#2 - A2(緑) - B2 ... D6',
        range: '73.42 Hz ～ 1174.66 Hz',
        tip: '第8弦(A4)・第13弦(A3)・第18弦(A2)・第3弦(A5)の緑弦から優先的に調律します',
      },
      {
        inst: '二胡 / 琵琶',
        notes: 'D4 - A4 / A2 - D3 - E3 - A3',
        range: '110.00 Hz ～ 440.00 Hz',
        tip: '二胡はビブラートをかけずに一定の弓速でロングトーンを弾くと正確に測定できます',
      },
    ],
    faqTitle: 'よくある質問 (FAQ)',
    faqs: [
      {
        q: '1. なぜ最初に調律する弦を選択するのですか？',
        a: '先に弦をタップしてロックすることで、対象弦の周波数帯のみを集中して検出し、隣の弦の共鳴や周囲の雑音による誤判定を防ぎます。また±5セント以内で安定すると完了チャイムが鳴ります。',
      },
      {
        q: '2. 弦を弾いた直後にピッチが高く表示されるのはなぜですか？',
        a: '弦楽器の物理特性として、弾いた瞬間は張力が強まりピッチが一時的に高くなります。本ツールはアタック直後の乱れを自動フィルタリングし、安定したサステイン部分の音程をロックします。',
      },
      {
        q: '3. 周囲が騒がしい場所で正確にチューニングするには？',
        a: '調律したい弦を選択した上で、上部バーの「ノイズ除去」をONにしてください。狭帯域バンドパスフィルターが周囲の会話や生活音を遮断します。',
      },
      {
        q: '4. マイクの音声データは外部サーバーに送信されますか？',
        a: '一切送信されません。すべての周波数解析および騒音計測はお使いのブラウザ内の Web Audio API で100%ローカル処理されます。',
      },
    ],
    copyright: '© 2026 音律工房 プロ — マルチプラットフォーム音楽ツール（チューナー・メトロノーム・コード辞典・耳トレ・騒音計）',
    privacyBtn: 'プライバシーポリシー',
    termsBtn: '利用規約',
    privacyText1:
      '1. ローカル音声処理：マイク権限はブラウザ内の Web Audio API によるリアルタイム周波数解析にのみ使用されます。音声データが録音・保存・外部送信されることは一切ありません。',
    privacyText2:
      '2. 設定の保存：A4基準ピッチ、音律、ノイズ除去、ライト/ダークテーマ設定はお使いの端末内にのみ保存されます。',
    termsText1:
      '1. 無料利用許諾：本ツール（チューナー・メトロノーム・コード辞典・耳トレ・騒音計）は音楽学習者・演奏者・教育者どなたでも無料でご利用いただけます。',
    termsText2:
      '2. 弦の巻きすぎ防止：高音弦を調律する際は、周波数表示を確認しながらペグを少しずつ回し、弦の破損にご注意ください。',
    closeBtn: '閉じる',
  },
};

export const SeoKnowledgeFooter: React.FC<{
  theme: ThemePalette;
  lang: SupportedLang;
}> = ({ theme, lang }) => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const c = FOOTER_CONTENT[lang];

  return (
    <section
      className="max-w-5xl w-full mx-auto px-3 sm:px-6 pt-8 pb-12 space-y-6 border-t mt-6 transition-colors duration-300"
      style={{
        borderColor: theme.borderPrimary,
        color: theme.textPrimary,
      }}
    >
      {/* Section 1: Acoustic Technology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article
          className="p-4 rounded-2xl border space-y-2"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderPrimary,
          }}
        >
          <div
            className="flex items-center gap-2 font-bold text-sm"
            style={{ color: theme.accentHex }}
          >
            <Cpu className="w-4 h-4" />
            <h2>{c.card1Title}</h2>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            {c.card1Desc}
          </p>
        </article>

        <article
          className="p-4 rounded-2xl border space-y-2"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderPrimary,
          }}
        >
          <div
            className="flex items-center gap-2 font-bold text-sm"
            style={{ color: theme.secondaryHex }}
          >
            <Volume2 className="w-4 h-4" />
            <h2>{c.card2Title}</h2>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            {c.card2Desc}
          </p>
        </article>

        <article
          className="p-4 rounded-2xl border space-y-2"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderPrimary,
          }}
        >
          <div
            className="flex items-center gap-2 font-bold text-sm"
            style={{ color: theme.warnHex }}
          >
            <Shield className="w-4 h-4" />
            <h2>{c.card3Title}</h2>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            {c.card3Desc}
          </p>
        </article>
      </div>

      {/* Section 2: Standard Instrument Tuning Reference Table */}
      <div
        className="rounded-2xl border p-4 sm:p-6 space-y-3"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
        }}
      >
        <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
          <BookOpen className="w-4 h-4" style={{ color: theme.accentHex }} />
          <h2>{c.tableTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: theme.borderPrimary,
                  color: theme.textSecondary,
                }}
              >
                <th className="py-2 pr-3">{c.thInst}</th>
                <th className="py-2 px-3">{c.thNotes}</th>
                <th className="py-2 px-3">{c.thRange}</th>
                <th className="py-2 pl-3">{c.thTip}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {c.rows.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-b last:border-b-0"
                  style={{ borderColor: theme.borderPrimary }}
                >
                  <td className="py-2.5 pr-3 font-sans font-semibold">
                    {r.inst}
                  </td>
                  <td
                    className="py-2.5 px-3 font-bold"
                    style={{ color: theme.accentHex }}
                  >
                    {r.notes}
                  </td>
                  <td className="py-2.5 px-3">{r.range}</td>
                  <td
                    className="py-2.5 pl-3 font-sans"
                    style={{ color: theme.textSecondary }}
                  >
                    {r.tip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: FAQ */}
      <div
        className="rounded-2xl border p-4 sm:p-6 space-y-4"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
        }}
      >
        <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
          <HelpCircle
            className="w-4 h-4"
            style={{ color: theme.secondaryHex }}
          />
          <h2>{c.faqTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {c.faqs.map((faq, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="font-bold">{faq.q}</h3>
              <p
                className="leading-relaxed"
                style={{ color: theme.textSecondary }}
              >
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Dedicated Instrument Tuners & Music Tools Internal Link Matrix (GeFei SEO Internal Linking) */}
      <nav
        aria-label={
          lang === 'zh'
            ? '专项乐器调音器与音乐工具导航'
            : lang === 'ja'
            ? '楽器別チューナー＆音楽ツール一覧'
            : 'Dedicated Instrument Tuners & Online Music Tools'
        }
        className="rounded-2xl border p-4 sm:p-5 space-y-3"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderPrimary,
        }}
      >
        <h2 className="font-bold text-xs sm:text-sm" style={{ color: theme.accentHex }}>
          {lang === 'zh'
            ? '专项乐器调音器与在线音乐工具直达入口'
            : lang === 'ja'
            ? '楽器別オンラインチューナー＆音楽ツール一覧'
            : 'Dedicated Online Instrument Tuners & Music Tools'}
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            {
              href: '/',
              label: {
                zh: '全能乐器调音器首页',
                en: 'Chromatic & Instrument Tuner Home',
                ja: '楽器チューナー ホーム',
              },
            },
            {
              href: '/guitar-tuner',
              label: {
                zh: '六弦吉他在线调音器',
                en: 'Online Guitar Tuner (Standard & Drop D)',
                ja: 'ギターオンラインチューナー',
              },
            },
            {
              href: '/ukulele-tuner',
              label: {
                zh: '尤克里里在线调音器',
                en: 'Online Ukulele Tuner (GCEA High-G)',
                ja: 'ウクレレオンラインチューナー',
              },
            },
            {
              href: '/violin-tuner',
              label: {
                zh: '小提琴与大提琴调音器',
                en: 'Online Violin & Cello Tuner (GDAE)',
                ja: 'バイオリン・チェロチューナー',
              },
            },
            {
              href: '/guzheng-tuner',
              label: {
                zh: '21弦古筝在线调音器 (D调/G调)',
                en: 'Online 21-String Guzheng Tuner',
                ja: '21弦古筝オンラインチューナー',
              },
            },
            {
              href: '/bass-tuner',
              label: {
                zh: '四弦与五弦贝斯调音器',
                en: 'Online 4 & 5-String Bass Tuner',
                ja: 'エレキベースチューナー',
              },
            },
            {
              href: '/online-metronome',
              label: {
                zh: '在线专业节拍器 (BPM测速)',
                en: 'Free Online Metronome with Tap Tempo',
                ja: 'オンラインメトロノーム (BPM測定)',
              },
            },
            {
              href: '/guitar-chords',
              label: {
                zh: '吉他与尤克里里和弦指法库',
                en: 'Interactive Guitar & Ukulele Chord Chart',
                ja: 'ギター＆ウクレレコード指板辞典',
              },
            },
            {
              href: '/decibel-meter',
              label: {
                zh: '在线环境噪音分贝检测仪',
                en: 'Online Ambient Noise Decibel Meter (dB)',
                ja: 'オンライン環境騒音計・スペクトラム分析',
              },
            },
            {
              href: '/drop-d-alternate-guitar-tuning-chart',
              label: {
                zh: 'Drop D 与特殊调弦频率/琴颈张力计算器',
                en: 'Drop D, Open G & DADGAD Tuning Frequency & Tension Calculator',
                ja: 'ドロップD・変則チューニング周波数＆張力計算機',
              },
            },
            {
              href: '/bpm-to-ms-delay-time-calculator',
              label: {
                zh: 'BPM 转毫秒 (ms) 延迟时间与混响预延迟计算器',
                en: 'BPM to Milliseconds (ms) Delay & Pre-Delay Calculator',
                ja: 'BPM→ミリ秒 (ms) ディレイ＆プリディレイ計算機',
              },
            },
            {
              href: '/capo-transposition-chord-chart-calculator',
              label: {
                zh: '吉他与尤克里里变调夹 (Capo) 转调和弦计算器',
                en: 'Guitar & Ukulele Capo Transposition Chord Calculator',
                ja: 'ギター＆ウクレレ カポタスト移調コード計算機',
              },
            },
            {
              href: '/guzheng-21-string-modulation-chart',
              label: {
                zh: '21弦古筝 D/G/C/F/A 调转调雁柱移动指南与频率表',
                en: '21-String Guzheng Modulation & Yanzhu Bridge Position Chart',
                ja: '21弦古筝 転調＆柱（雁柱）移動周波数チャート',
              },
            },
            {
              href: '/432hz-vs-440hz-vs-442hz-pitch-frequency-calculator',
              label: {
                zh: 'A4=432Hz vs 440Hz vs 442Hz 标准音频率与纯律音分差计算器',
                en: '432Hz vs 440Hz vs 442Hz Pitch Frequency & 12-TET/Just Intonation Calculator',
                ja: '432Hz vs 440Hz vs 442Hz 基準ピッチ周波数＆音律セント偏差計算機',
              },
            },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-xl border font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.bgSubtle,
                borderColor: theme.borderPrimary,
                color: theme.textPrimary,
              }}
            >
              {link.label[lang]}
            </a>
          ))}
        </div>
      </nav>

      {/* Footer Bar */}
      <footer
        className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        style={{
          borderColor: theme.borderPrimary,
          color: theme.textMuted,
        }}
      >
        <div>{c.copyright}</div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="hover:underline flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{c.privacyBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="hover:underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{c.termsBtn}</span>
          </button>
        </div>
      </footer>

      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="max-w-lg w-full rounded-2xl border p-6 space-y-4 text-xs"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.borderPrimary,
              color: theme.textPrimary,
            }}
          >
            <h3 className="text-base font-bold">
              {legalModal === 'privacy' ? c.privacyBtn : c.termsBtn}
            </h3>
            <div
              className="space-y-2 leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              {legalModal === 'privacy' ? (
                <>
                  <p>{c.privacyText1}</p>
                  <p>{c.privacyText2}</p>
                </>
              ) : (
                <>
                  <p>{c.termsText1}</p>
                  <p>{c.termsText2}</p>
                </>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-1.5 rounded-xl text-white font-bold"
                style={{ backgroundColor: theme.accentHex }}
              >
                {c.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
