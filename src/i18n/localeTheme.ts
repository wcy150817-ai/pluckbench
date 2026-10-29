export type SupportedLang = 'zh' | 'en' | 'ja';
export type GeoRegionCode = 'CN' | 'US' | 'EU' | 'JP';
export type ColorMode = 'dark' | 'light';

export interface ThemePalette {
  region: GeoRegionCode;
  mode: ColorMode;
  isLight: boolean;
  bgPrimary: string;
  bgCard: string;
  bgSubtle: string;
  bgHeader: string;
  borderPrimary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentHex: string;
  secondaryHex: string;
  warnHex: string;
  dangerHex: string;
  dialGradientStart: string;
  dialGradientEnd: string;
}

export const REGIONAL_THEMES: Record<GeoRegionCode, Record<ColorMode, ThemePalette>> = {
  CN: {
    dark: {
      region: 'CN',
      mode: 'dark',
      isLight: false,
      bgPrimary: '#070a0f',
      bgCard: '#0d131c',
      bgSubtle: '#111926',
      bgHeader: 'rgba(9, 13, 20, 0.92)',
      borderPrimary: '#1e293b',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accentHex: '#10b981',
      secondaryHex: '#38bdf8',
      warnHex: '#f59e0b',
      dangerHex: '#f43f5e',
      dialGradientStart: '#111a26',
      dialGradientEnd: '#090d14',
    },
    light: {
      region: 'CN',
      mode: 'light',
      isLight: true,
      bgPrimary: '#f2f7f5',
      bgCard: '#ffffff',
      bgSubtle: '#e6f0ec',
      bgHeader: 'rgba(255, 255, 255, 0.94)',
      borderPrimary: '#cbd5e1',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      accentHex: '#059669',
      secondaryHex: '#0284c7',
      warnHex: '#d97706',
      dangerHex: '#e11d48',
      dialGradientStart: '#f8fafc',
      dialGradientEnd: '#e2ece8',
    },
  },
  US: {
    dark: {
      region: 'US',
      mode: 'dark',
      isLight: false,
      bgPrimary: '#050814',
      bgCard: '#0b1124',
      bgSubtle: '#111a36',
      bgHeader: 'rgba(7, 11, 24, 0.92)',
      borderPrimary: '#1e2b4d',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accentHex: '#06b6d4',
      secondaryHex: '#818cf8',
      warnHex: '#fbbf24',
      dangerHex: '#fb7185',
      dialGradientStart: '#101b38',
      dialGradientEnd: '#070b18',
    },
    light: {
      region: 'US',
      mode: 'light',
      isLight: true,
      bgPrimary: '#f0f5fc',
      bgCard: '#ffffff',
      bgSubtle: '#e2ecf8',
      bgHeader: 'rgba(255, 255, 255, 0.94)',
      borderPrimary: '#cbd5e1',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      accentHex: '#0284c7',
      secondaryHex: '#4f46e5',
      warnHex: '#d97706',
      dangerHex: '#e11d48',
      dialGradientStart: '#f8fafc',
      dialGradientEnd: '#e0eaf8',
    },
  },
  EU: {
    dark: {
      region: 'EU',
      mode: 'dark',
      isLight: false,
      bgPrimary: '#0c0907',
      bgCard: '#17120e',
      bgSubtle: '#221a14',
      bgHeader: 'rgba(18, 13, 10, 0.92)',
      borderPrimary: '#2e241d',
      textPrimary: '#fef3c7',
      textSecondary: '#a8a29e',
      textMuted: '#78716c',
      accentHex: '#f59e0b',
      secondaryHex: '#10b981',
      warnHex: '#fb923c',
      dangerHex: '#f87171',
      dialGradientStart: '#241a12',
      dialGradientEnd: '#120d0a',
    },
    light: {
      region: 'EU',
      mode: 'light',
      isLight: true,
      bgPrimary: '#faf6f0',
      bgCard: '#ffffff',
      bgSubtle: '#f3ece1',
      bgHeader: 'rgba(255, 255, 255, 0.94)',
      borderPrimary: '#d6cfc7',
      textPrimary: '#1c1917',
      textSecondary: '#44403c',
      textMuted: '#78716c',
      accentHex: '#d97706',
      secondaryHex: '#059669',
      warnHex: '#ea580c',
      dangerHex: '#dc2626',
      dialGradientStart: '#fffbeb',
      dialGradientEnd: '#f3ead8',
    },
  },
  JP: {
    dark: {
      region: 'JP',
      mode: 'dark',
      isLight: false,
      bgPrimary: '#090612',
      bgCard: '#130d24',
      bgSubtle: '#1d1436',
      bgHeader: 'rgba(12, 8, 22, 0.92)',
      borderPrimary: '#2b1f47',
      textPrimary: '#f5f3ff',
      textSecondary: '#c4b5fd',
      textMuted: '#7c6f9f',
      accentHex: '#c084fc',
      secondaryHex: '#2dd4bf',
      warnHex: '#facc15',
      dangerHex: '#f43f5e',
      dialGradientStart: '#1e1438',
      dialGradientEnd: '#0c0818',
    },
    light: {
      region: 'JP',
      mode: 'light',
      isLight: true,
      bgPrimary: '#faf5ff',
      bgCard: '#ffffff',
      bgSubtle: '#f3e8ff',
      bgHeader: 'rgba(255, 255, 255, 0.94)',
      borderPrimary: '#d8b4fe',
      textPrimary: '#1e1b4b',
      textSecondary: '#4c1d95',
      textMuted: '#6b7280',
      accentHex: '#9333ea',
      secondaryHex: '#0d9488',
      warnHex: '#ca8a04',
      dangerHex: '#e11d48',
      dialGradientStart: '#fdf4ff',
      dialGradientEnd: '#f3e8ff',
    },
  },
};

export const REGION_TO_LANG: Record<GeoRegionCode, SupportedLang> = {
  CN: 'zh',
  US: 'en',
  EU: 'en',
  JP: 'ja',
};

export interface GeoDetectionInfo {
  region: GeoRegionCode;
  lang: SupportedLang;
  ip?: string;
}

export function getInitialGeoRegion(): GeoRegionCode {
  if (typeof window === 'undefined') return 'US';
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('region')?.toUpperCase();
  if (forced === 'CN' || forced === 'US' || forced === 'EU' || forced === 'JP') {
    return forced;
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const navLang = (navigator.language || 'en-US').toLowerCase();
  if (tz.includes('Tokyo') || navLang.startsWith('ja')) {
    return 'JP';
  }
  if (
    tz.includes('Shanghai') ||
    tz.includes('Chongqing') ||
    tz.includes('Hong_Kong') ||
    tz.includes('Taipei') ||
    tz.includes('Singapore') ||
    navLang.startsWith('zh')
  ) {
    return 'CN';
  }
  if (tz.startsWith('Europe/')) {
    return 'EU';
  }
  return 'US';
}

export async function detectUserGeoRegion(): Promise<GeoDetectionInfo> {
  const initialRegion = getInitialGeoRegion();
  const fallback: GeoDetectionInfo = {
    region: initialRegion,
    lang: REGION_TO_LANG[initialRegion],
  };

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        const cc = String(data.country_code).toUpperCase();
        const ip = data.ip ? String(data.ip) : undefined;
        if (['CN', 'HK', 'MO', 'TW', 'SG', 'MY'].includes(cc)) {
          return { region: 'CN', lang: 'zh', ip };
        }
        if (['JP'].includes(cc)) {
          return { region: 'JP', lang: 'ja', ip };
        }
        if (
          [
            'DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'SE', 'CH', 'AT', 'BE', 'PL', 'NO', 'DK', 'FI', 'IE', 'PT',
          ].includes(cc)
        ) {
          return { region: 'EU', lang: 'en', ip };
        }
        return { region: 'US', lang: 'en', ip };
      }
    }
  } catch {
    // Use timezone fallback
  }
  return fallback;
}

/**
 * Complete, 100% pure single-language dictionary per locale (zero mixed-language strings!)
 */
export const UI_TEXT = {
  zh: {
    brandName: '音律工坊',
    brandTag: '专业版',
    seoH1: '在线乐器调音器、节拍器与和弦指法工作台',
    subtitle: '先选定目标琴弦 · 保持音准稳定即可触发完成提示音',
    regionName: {
      CN: '中国区 · 翡翠主题',
      US: '北美区 · 深空蓝主题',
      EU: '欧洲区 · 琥珀金主题',
      JP: '日本区 · 紫晶主题',
    },
    modeDark: '夜间版',
    modeLight: '白天版',
    switchToLight: '切换白天版',
    switchToDark: '切换夜间版',
    regionMenuTitle: '切换地区配色与语言',
    tabTuner: '乐器调音器',
    tabMetronome: '专业节拍器',
    tabChords: '和弦指法库',
    tabEar: '音感练耳',
    tabDecibel: '环境分贝仪',
    micOn: '测音中',
    micOff: '开启麦克风',
    simOn: '停止演示',
    simOff: '模拟调弦',
    noiseReductionOn: '强效降噪已开',
    noiseReductionOff: '环境降噪',
    step1SelectString: '第1步：点击选定要调的琴弦',
    autoAdvanceLabel: '调准后自动切下一弦',
    flatTighten: '偏低 · 拧紧 ▶',
    sharpLoosen: '◀ 偏高 · 放松',
    inTuneLocked: '✓ 该弦已调准！已响确认音',
    holdingForLock: '进入合格区 · 稳定保持中',
    waitingForString: '请拨响当前选定的琴弦...',
    playingRefTone: '正在播放原声基准音',
    dialTopScaleLabel: '音分偏差刻度 (±5音分稳定合格区)',
    dialInnerScaleLabel: '动态赫兹频率尺 (Hz)',
    dialTrailLabel: '延音稳定度轨迹',
    targetPitch: '当前锁定目标弦',
    measuredPitch: '实测稳态频率',
    stringLockedBadge: '已锁弦',
    narrowFilterBadge: '窄带抗噪',
    currentStringBadge: '当前弦',
    tapeHint: '点击标尺可指定目标音',
    modeManualTitle: '选弦调音',
    modeManualSub: '先选哪根弦再调',
    modeAutoTitle: '自动寻弦',
    modeAutoSub: '自动识别最近弦',
    modeSoundTitle: '标准音耳调',
    modeSoundSub: '播放真实乐器原声',
    tuningVariantLabel: '定弦:',
    allStringsTuned: '🎉 当前乐器全部琴弦已校准完毕！',
    nextUntunedString: '切换下一根待调琴弦',
    noisyAlertTitle: '检测到周围环境较嘈杂：',
    noisyAlertDesc: '环境杂音可能影响拾音，建议开启针对当前琴弦频段的强效降噪。',
    noisyAlertBtn: '一键开启强效降噪',
    ignoreBtn: '忽略',
    // Settings Modal
    settingsTitle: '声学参数与抗噪设置',
    noiseSectionTitle: '硬件级窄带滤波与环境抗噪',
    noiseSectionDesc: '开启后自动根据目标琴弦频率收窄滤波器，屏蔽说话声、风扇与杂音',
    noiseBtnOn: '已开启强效降噪',
    noiseBtnOff: '开启强效降噪',
    noiseGateLabel: '麦克风拾音门限',
    noiseGateQuiet: '安静室内',
    noiseGateNormal: '均衡防抖',
    noiseGateNoisy: '嘈杂抗噪',
    timbreSectionTitle: '真实乐器物理建模音色',
    volumeLabel: '音量',
    a4SectionTitle: 'A4 标准音基准频率',
    temperamentSectionTitle: '律制系统',
    notationSectionTitle: '音名显示格式',
    notationLetter: '音名 (C D E)',
    notationSolfege: '唱名 (Do Re Mi)',
    notationNumbered: '简谱 (1 2 3)',
    dampingSectionTitle: '指针流体阻尼平顺度',
    dampingFast: '灵敏跟随',
    dampingBalanced: '稳态均衡',
    dampingSmooth: '重阻尼防晃',
    trailToggleLabel: '显示延音稳定度轨迹线',
    chimeToggleLabel: '琴弦调准后播放确认提示音',
    resetDefaultsBtn: '恢复默认设置',
    doneBtn: '完成并应用',
    // Microphone Permission Modal & Banner
    micModalBadge: '录音 / 麦克风权限提示',
    micModalTitle: '请开启麦克风（录音）权限以进行实时调音',
    micModalDesc:
      '为了通过设备麦克风实时检测琴弦振动频率（Hz）与音分偏差，请在点击下方按钮后，在浏览器弹出的录音/麦克风权限窗口中选择「允许」。',
    micModalPoint1Title: '高精度实时拾音测频',
    micModalPoint1Desc:
      '自动识别吉他、尤克里里、古筝、贝斯与提琴琴弦基频，内置环境窄带抗噪滤波。',
    micModalPoint2Title: '100% 浏览器本地处理 · 绝不录音上传',
    micModalPoint2Desc:
      '所有音频流仅在您的设备本地通过 Web Audio API 实时计算频率，绝不存储或上传任何声音数据。',
    micModalAllowBtn: '立即授权并开启麦克风调音',
    micModalSoundOnlyBtn: '先使用标准音耳调（暂不开麦克风）',
    micModalLaterBtn: '稍后手动开启',
    micModalErrorTitle: '未能获取麦克风（录音）权限',
    micModalErrorSteps:
      '1. 请点击浏览器地址栏左侧的「锁形图标 🔒」或「网站设置」图标；2. 将「麦克风 / 录音」权限更改为「允许」；3. 若在手机端打开，请确认手机系统设置已允许浏览器使用麦克风，然后点击下方重试。',
    micModalRetryBtn: '重新请求麦克风权限',
    micBannerPrompt:
      '麦克风尚未开启：点击授权麦克风（录音）权限，即可开始实时拨弦测音。',
    micBannerBtn: '开启麦克风权限',
  },
  en: {
    brandName: 'PluckBench',
    brandTag: 'Pro',
    seoH1: 'Online Instrument Tuner, Metronome & Chord Library',
    subtitle: 'Step 1: Select String · Step 2: Hold in ±5¢ Zone for Chime',
    regionName: {
      CN: 'CN · Emerald Theme',
      US: 'US · Cobalt Theme',
      EU: 'EU · Amber Theme',
      JP: 'JP · Violet Theme',
    },
    modeDark: 'Dark',
    modeLight: 'Light',
    switchToLight: 'Light Mode',
    switchToDark: 'Dark Mode',
    regionMenuTitle: 'Select Region Theme & Language',
    tabTuner: 'Instrument Tuner',
    tabMetronome: 'Metronome',
    tabChords: 'Chord Library',
    tabEar: 'Ear Trainer',
    tabDecibel: 'dB Noise Meter',
    micOn: 'Listening',
    micOff: 'Start Mic',
    simOn: 'Stop Demo',
    simOff: 'Demo Pluck',
    noiseReductionOn: 'Noise Filter ON',
    noiseReductionOff: 'Noise Filter',
    step1SelectString: 'Step 1: Tap a String to Lock Target',
    autoAdvanceLabel: 'Auto-next string',
    flatTighten: 'Flat · Tighten ▶',
    sharpLoosen: '◀ Sharp · Loosen',
    inTuneLocked: '✓ String Tuned! Chime Played',
    holdingForLock: 'In ±5¢ Zone · Holding...',
    waitingForString: 'Pluck the selected string...',
    playingRefTone: 'Playing Acoustic Reference Tone',
    dialTopScaleLabel: 'CENTS DEVIATION (±5¢ TARGET HOLD ZONE)',
    dialInnerScaleLabel: 'DYNAMIC FREQUENCY SCALE (Hz)',
    dialTrailLabel: 'PITCH STABILITY SCOPE',
    targetPitch: 'Locked Target',
    measuredPitch: 'Measured Pitch',
    stringLockedBadge: 'Locked',
    narrowFilterBadge: 'Noise Filter',
    currentStringBadge: 'Active',
    tapeHint: 'Tap ruler to select note',
    modeManualTitle: 'Select String',
    modeManualSub: 'Lock string first',
    modeAutoTitle: 'Auto Detect',
    modeAutoSub: 'Find closest string',
    modeSoundTitle: 'Reference Tone',
    modeSoundSub: 'Play acoustic sound',
    tuningVariantLabel: 'Tuning:',
    allStringsTuned: '🎉 All strings on this instrument are tuned!',
    nextUntunedString: 'Next Untuned String',
    noisyAlertTitle: 'High Ambient Noise Detected: ',
    noisyAlertDesc: 'Background chatter may interfere. Enable Narrow-Band Noise Filter.',
    noisyAlertBtn: 'Enable Noise Filter',
    ignoreBtn: 'Dismiss',
    // Settings Modal
    settingsTitle: 'Acoustic & Noise Filter Settings',
    noiseSectionTitle: 'Narrow-Band Hardware Noise Suppression',
    noiseSectionDesc: 'Automatically narrows bandpass around target string to reject chatter and room noise',
    noiseBtnOn: 'Noise Filter Active',
    noiseBtnOff: 'Enable Filter',
    noiseGateLabel: 'Microphone Noise Gate',
    noiseGateQuiet: 'Quiet Room',
    noiseGateNormal: 'Balanced',
    noiseGateNoisy: 'Noisy Room',
    timbreSectionTitle: 'Physical Modeling Acoustic Timbre',
    volumeLabel: 'Volume',
    a4SectionTitle: 'A4 Reference Concert Pitch',
    temperamentSectionTitle: 'Musical Temperament',
    notationSectionTitle: 'Note Display Format',
    notationLetter: 'Letters (C D E)',
    notationSolfege: 'Solfège (Do Re)',
    notationNumbered: 'Numbered (1 2 3)',
    dampingSectionTitle: 'Needle Fluid Damping',
    dampingFast: 'Responsive',
    dampingBalanced: 'Balanced',
    dampingSmooth: 'Heavy Smooth',
    trailToggleLabel: 'Show Pitch Stability Scope',
    chimeToggleLabel: 'Play Confirmation Chime When Tuned',
    resetDefaultsBtn: 'Reset Defaults',
    doneBtn: 'Apply & Close',
    // Microphone Permission Modal & Banner
    micModalBadge: 'Microphone Permission Guide',
    micModalTitle: 'Enable Microphone Access for Real-Time Tuning',
    micModalDesc:
      'To detect your instrument’s string frequency (Hz) and cent offset in real time, click the button below and select "Allow" when your browser requests microphone/recording access.',
    micModalPoint1Title: 'Sub-Cent Real-Time Pitch Detection',
    micModalPoint1Desc:
      'Automatically locks onto guitar, ukulele, bass, violin, and zither fundamentals with narrow-band noise filtering.',
    micModalPoint2Title: '100% Local Browser Processing · Zero Recording',
    micModalPoint2Desc:
      'All audio streams are analyzed locally on your device via Web Audio API. No audio is ever recorded, saved, or uploaded.',
    micModalAllowBtn: 'Allow & Start Microphone Tuner',
    micModalSoundOnlyBtn: 'Use Reference Tones Only (No Mic)',
    micModalLaterBtn: 'Dismiss for Now',
    micModalErrorTitle: 'Microphone Access Was Blocked or Unavailable',
    micModalErrorSteps:
      '1. Click the Lock 🔒 or Site Settings icon on the left side of your browser address bar. 2. Set "Microphone" permission to "Allow". 3. On mobile devices, ensure your browser has Microphone access enabled in System Settings, then tap Retry below.',
    micModalRetryBtn: 'Retry Microphone Access',
    micBannerPrompt:
      'Microphone is currently off: Grant microphone access to start real-time string pitch detection.',
    micBannerBtn: 'Enable Microphone',
  },
  ja: {
    brandName: '音律工房',
    brandTag: 'プロ',
    seoH1: 'オンライン楽器チューナー・メトロノーム＆コード辞典',
    subtitle: '1. 調律する弦を選択 · 2. ±5¢安定保持で完了音が鳴ります',
    regionName: {
      CN: '中国 · 翡翠テーマ',
      US: '北米 · コバルトテーマ',
      EU: '欧州 · 琥珀テーマ',
      JP: '日本 · 紫水晶テーマ',
    },
    modeDark: 'ダーク',
    modeLight: 'ライト',
    switchToLight: 'ライトモードへ',
    switchToDark: 'ダークモードへ',
    regionMenuTitle: '地域テーマと言語の切り替え',
    tabTuner: '楽器チューナー',
    tabMetronome: 'メトロノーム',
    tabChords: 'コード辞典',
    tabEar: '耳トレ & 音叉',
    tabDecibel: '騒音計',
    micOn: '測定中',
    micOff: 'マイク開始',
    simOn: 'デモ停止',
    simOff: '調弦デモ',
    noiseReductionOn: 'ノイズ除去ON',
    noiseReductionOff: 'ノイズ除去',
    step1SelectString: 'ステップ1：調律する弦をタップして固定',
    autoAdvanceLabel: '完了後に次の弦へ自動移動',
    flatTighten: '低い · 締める ▶',
    sharpLoosen: '◀ 高い · 緩める',
    inTuneLocked: '✓ 調律完了！確認チャイム再生',
    holdingForLock: '±5¢圏内 · 安定保持中...',
    waitingForString: '選択した弦を弾いてください...',
    playingRefTone: 'リアル楽器基準音を再生中',
    dialTopScaleLabel: 'セント偏差目盛り (±5¢ 安定合格ゾーン)',
    dialInnerScaleLabel: '動的ヘルツ周波数目盛り (Hz)',
    dialTrailLabel: 'ピッチ安定軌跡',
    targetPitch: 'ロック中の目標弦',
    measuredPitch: '実測周波数',
    stringLockedBadge: '弦固定',
    narrowFilterBadge: '狭帯域防音',
    currentStringBadge: '選択中',
    tapeHint: '目盛りをタップして音を指定',
    modeManualTitle: '弦指定モード',
    modeManualSub: '弦を選んで調律',
    modeAutoTitle: '自動認識',
    modeAutoSub: '近い弦を自動判定',
    modeSoundTitle: '基準音再生',
    modeSoundSub: 'リアル楽器音で耳調律',
    tuningVariantLabel: '調弦:',
    allStringsTuned: '🎉 すべての弦のチューニングが完了しました！',
    nextUntunedString: '次の未調律の弦へ',
    noisyAlertTitle: '周囲の騒音を検知しました：',
    noisyAlertDesc: '雑音を防ぐため、狭帯域ノイズ除去フィルターを有効にしてください。',
    noisyAlertBtn: 'ノイズ除去をON',
    ignoreBtn: '閉じる',
    // Settings Modal
    settingsTitle: '音響パラメータとノイズ除去設定',
    noiseSectionTitle: '狭帯域バンドパス・ノイズ除去',
    noiseSectionDesc: '対象の弦の周波数帯のみを通過させ、周囲の会話やファン音を遮断します',
    noiseBtnOn: 'ノイズ除去 有効',
    noiseBtnOff: '有効にする',
    noiseGateLabel: 'マイク感度しきい値',
    noiseGateQuiet: '静かな室内',
    noiseGateNormal: '標準バランス',
    noiseGateNoisy: '騒音環境',
    timbreSectionTitle: '物理モデリング楽器音色',
    volumeLabel: '音量',
    a4SectionTitle: 'A4 基準ピッチ周波数',
    temperamentSectionTitle: '音律システム',
    notationSectionTitle: '音名表示スタイル',
    notationLetter: '英音名 (C D E)',
    notationSolfege: '階名 (Do Re Mi)',
    notationNumbered: '数字譜 (1 2 3)',
    dampingSectionTitle: '指針ダンピング滑らかさ',
    dampingFast: '高速応答',
    dampingBalanced: '標準安定',
    dampingSmooth: '高減衰スムーズ',
    trailToggleLabel: 'ピッチ安定軌跡を表示',
    chimeToggleLabel: '調律完了時に確認チャイムを鳴らす',
    resetDefaultsBtn: '初期設定に戻す',
    doneBtn: '完了',
    // Microphone Permission Modal & Banner
    micModalBadge: 'マイク（録音）権限のご案内',
    micModalTitle: 'リアルタイム調律のためにマイク権限を許可してください',
    micModalDesc:
      '楽器の弦の振動周波数（Hz）とセント偏差をリアルタイムに検出するため、下のボタンを押した後、ブラウザのマイク（録音）権限ポップアップで「許可」を選択してください。',
    micModalPoint1Title: '高精度リアルタイム周波数測定',
    micModalPoint1Desc:
      'ギター・ウクレレ・古筝・ベース・バイオリンの基音を自動認識し、周囲の雑音をフィルタリングします。',
    micModalPoint2Title: '100% ブラウザ内ローカル処理・録音なし',
    micModalPoint2Desc:
      'すべての音声信号はお使いの端末内の Web Audio API でのみ解析され、録音やサーバーへの送信は一切行われません。',
    micModalAllowBtn: 'マイクを許可してチューナーを開始',
    micModalSoundOnlyBtn: '基準音モードで耳調律する（マイクなし）',
    micModalLaterBtn: 'あとで手動で開始',
    micModalErrorTitle: 'マイク（録音）へのアクセスが拒否されました',
    micModalErrorSteps:
      '1. ブラウザのアドレスバー左側の「鍵アイコン 🔒」または「サイト設定」をタップします。2.「マイク」の権限を「許可」に変更します。3. スマホの場合はOS設定でブラウザのマイク権限をONにしてから、下の再試行ボタンを押してください。',
    micModalRetryBtn: 'マイク権限を再試行する',
    micBannerPrompt:
      'マイクがオフです：マイク（録音）権限を許可すると、リアルタイム調律が開始されます。',
    micBannerBtn: 'マイクを有効化',
  },
} as const;
