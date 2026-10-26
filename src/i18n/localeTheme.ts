export type SupportedLang = 'zh' | 'en' | 'ja';
export type ThemePaletteId = 'emerald-cn' | 'cobalt-us' | 'amber-eu' | 'violet-jp' | 'light-studio';

export interface ThemePalette {
  id: ThemePaletteId;
  nameZh: string;
  nameEn: string;
  regionBadge: string;
  isLight?: boolean;
  bgPrimary: string;
  bgCard: string;
  bgHeader: string;
  borderPrimary: string;
  textPrimary: string;
  textSecondary: string;
  accentHex: string;       // Primary in-tune / brand accent
  secondaryHex: string;    // Frequency / secondary accent
  warnHex: string;         // Flat / approaching
  dangerHex: string;       // Sharp / out of tune
  dialGradientStart: string;
  dialGradientEnd: string;
}

export const THEME_PALETTES: Record<ThemePaletteId, ThemePalette> = {
  'emerald-cn': {
    id: 'emerald-cn',
    nameZh: '东方翡翠暗黑 (CN 默认)',
    nameEn: 'Emerald Studio Dark (CN)',
    regionBadge: 'CN · 亚太华语区',
    bgPrimary: '#070a0f',
    bgCard: '#0d121b',
    bgHeader: 'rgba(9, 13, 20, 0.90)',
    borderPrimary: '#1e293b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accentHex: '#10b981',
    secondaryHex: '#38bdf8',
    warnHex: '#f59e0b',
    dangerHex: '#f43f5e',
    dialGradientStart: '#111927',
    dialGradientEnd: '#090d14',
  },
  'cobalt-us': {
    id: 'cobalt-us',
    nameZh: '北美深空电光蓝 (US/NA 默认)',
    nameEn: 'Cobalt Cyber Pro (US/NA)',
    regionBadge: 'US · North America',
    bgPrimary: '#050814',
    bgCard: '#0b1124',
    bgHeader: 'rgba(7, 11, 24, 0.90)',
    borderPrimary: '#1e2b4d',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    accentHex: '#06b6d4',
    secondaryHex: '#818cf8',
    warnHex: '#fbbf24',
    dangerHex: '#fb7185',
    dialGradientStart: '#101b38',
    dialGradientEnd: '#070b18',
  },
  'amber-eu': {
    id: 'amber-eu',
    nameZh: '欧洲复古电子管暖金 (EU 默认)',
    nameEn: 'Vintage Warm Amber (EU)',
    regionBadge: 'EU · Europe Region',
    bgPrimary: '#0c0907',
    bgCard: '#17120e',
    bgHeader: 'rgba(18, 13, 10, 0.90)',
    borderPrimary: '#2e241d',
    textPrimary: '#fef3c7',
    textSecondary: '#a8a29e',
    accentHex: '#f59e0b',
    secondaryHex: '#34d399',
    warnHex: '#fb923c',
    dangerHex: '#f87171',
    dialGradientStart: '#241a12',
    dialGradientEnd: '#120d0a',
  },
  'violet-jp': {
    id: 'violet-jp',
    nameZh: '东京极夜霓虹紫 (JP/KR 默认)',
    nameEn: 'Tokyo Neon Violet (JP)',
    regionBadge: 'JP · East Asia',
    bgPrimary: '#090612',
    bgCard: '#130d24',
    bgHeader: 'rgba(12, 8, 22, 0.90)',
    borderPrimary: '#2b1f47',
    textPrimary: '#f5f3ff',
    textSecondary: '#a78bfa',
    accentHex: '#c084fc',
    secondaryHex: '#2dd4bf',
    warnHex: '#facc15',
    dangerHex: '#f43f5e',
    dialGradientStart: '#1e1438',
    dialGradientEnd: '#0c0818',
  },
  'light-studio': {
    id: 'light-studio',
    nameZh: '日间极简浅色工作台 (Light)',
    nameEn: 'Daylight Studio (Light)',
    regionBadge: 'Daylight · 护眼浅色',
    isLight: true,
    bgPrimary: '#f1f5f9',
    bgCard: '#ffffff',
    bgHeader: 'rgba(255, 255, 255, 0.92)',
    borderPrimary: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    accentHex: '#059669',
    secondaryHex: '#0284c7',
    warnHex: '#d97706',
    dangerHex: '#e11d48',
    dialGradientStart: '#f8fafc',
    dialGradientEnd: '#e2e8f0',
  },
};

export interface GeoDetectionInfo {
  countryCode: string;
  countryName: string;
  ip?: string;
  lang: SupportedLang;
  paletteId: ThemePaletteId;
  source: 'ip-api' | 'timezone-fallback' | 'manual';
}

export async function detectUserGeoAndTheme(): Promise<GeoDetectionInfo> {
  // 1. Instant timezone heuristic first
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const navLang = (navigator.language || 'zh-CN').toLowerCase();

  let defaultInfo: GeoDetectionInfo = {
    countryCode: 'CN',
    countryName: 'China',
    lang: 'zh',
    paletteId: 'emerald-cn',
    source: 'timezone-fallback',
  };

  if (tz.includes('Tokyo') || navLang.startsWith('ja')) {
    defaultInfo = {
      countryCode: 'JP',
      countryName: 'Japan',
      lang: 'ja',
      paletteId: 'violet-jp',
      source: 'timezone-fallback',
    };
  } else if (
    tz.startsWith('Europe/') ||
    navLang.startsWith('de') ||
    navLang.startsWith('fr')
  ) {
    defaultInfo = {
      countryCode: 'EU',
      countryName: 'Europe',
      lang: 'en',
      paletteId: 'amber-eu',
      source: 'timezone-fallback',
    };
  } else if (
    tz.startsWith('America/') ||
    (navLang.startsWith('en') &&
      !tz.includes('Shanghai') &&
      !tz.includes('Chongqing') &&
      !tz.includes('Hong_Kong') &&
      !tz.includes('Taipei'))
  ) {
    defaultInfo = {
      countryCode: 'US',
      countryName: 'United States',
      lang: 'en',
      paletteId: 'cobalt-us',
      source: 'timezone-fallback',
    };
  }

  // 2. Try fast non-blocking IP geolocation lookup (timeout 2.2s)
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2200);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        const cc = String(data.country_code).toUpperCase();
        const ip = data.ip ? String(data.ip) : undefined;
        const countryName = data.country ? String(data.country) : cc;

        if (['CN', 'HK', 'MO', 'TW', 'SG'].includes(cc)) {
          return {
            countryCode: cc,
            countryName,
            ip,
            lang: 'zh',
            paletteId: 'emerald-cn',
            source: 'ip-api',
          };
        }
        if (['JP', 'KR'].includes(cc)) {
          return {
            countryCode: cc,
            countryName,
            ip,
            lang: cc === 'JP' ? 'ja' : 'en',
            paletteId: 'violet-jp',
            source: 'ip-api',
          };
        }
        if (
          [
            'DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'SE', 'CH', 'AT', 'BE', 'PL', 'NO', 'DK', 'FI', 'IE', 'PT',
          ].includes(cc)
        ) {
          return {
            countryCode: cc,
            countryName,
            ip,
            lang: 'en',
            paletteId: 'amber-eu',
            source: 'ip-api',
          };
        }
        return {
          countryCode: cc,
          countryName,
          ip,
          lang: 'en',
          paletteId: 'cobalt-us',
          source: 'ip-api',
        };
      }
    }
  } catch {
    // Fallback to timezone heuristic silently
  }

  return defaultInfo;
}

export const UI_TRANSLATIONS: Record<
  SupportedLang,
  {
    subtitle: string;
    tabTuner: string;
    tabMetronome: string;
    tabChords: string;
    tabEar: string;
    tabDecibel: string;
    micOn: string;
    micOff: string;
    simOn: string;
    simOff: string;
    noiseReductionOn: string;
    noiseReductionOff: string;
    step1SelectString: string;
    step2PluckAndHold: string;
    flatTighten: string;
    sharpLoosen: string;
    inTuneLocked: string;
    holdingForLock: string;
    waitingForString: string;
    targetPitch: string;
    measuredPitch: string;
    stringLockedBadge: string;
    modeManualTitle: string;
    modeManualSub: string;
    modeAutoTitle: string;
    modeAutoSub: string;
    modeSoundTitle: string;
    modeSoundSub: string;
    tuningVariantLabel: string;
    allStringsTuned: string;
    nextUntunedString: string;
    noisyAlertTitle: string;
    noisyAlertDesc: string;
    noisyAlertBtn: string;
    ignoreBtn: string;
  }
> = {
  zh: {
    subtitle: '先选定目标琴弦 · 保持音准小幅稳定自动响起完成提示音',
    tabTuner: '专业调音器',
    tabMetronome: '节拍器 & 测速',
    tabChords: '和弦指法库',
    tabEar: '音感练耳 & 音叉',
    tabDecibel: '环境分贝仪',
    micOn: '正在测音',
    micOff: '开启麦克风',
    simOn: '停止演示',
    simOff: '模拟调弦',
    noiseReductionOn: '强效降噪中',
    noiseReductionOff: '抗噪降噪',
    step1SelectString: '第 1 步：请先点击选定要调的琴弦（已锁定防跳弦）',
    step2PluckAndHold: '第 2 步：拨响该弦，指针在中心 ±5¢ 小波动区保持 0.9 秒即完成校准',
    flatTighten: '偏低 · 需拧紧 ▶',
    sharpLoosen: '◀ 偏高 · 需放松',
    inTuneLocked: '✓ 该弦已调准！已播放确认音',
    holdingForLock: '音准进入合格区 · 稳定保持中',
    waitingForString: '请拨响当前选定的琴弦...',
    targetPitch: '当前锁定目标弦',
    measuredPitch: '稳态实测频率',
    stringLockedBadge: '单弦锁定',
    modeManualTitle: '选弦调音 (推荐)',
    modeManualSub: '先选哪根弦再调音',
    modeAutoTitle: '自动识别琴弦',
    modeAutoSub: '自动寻找最近琴弦',
    modeSoundTitle: '播放标准原声',
    modeSoundSub: '听真实乐器音色耳调',
    tuningVariantLabel: '定弦方案:',
    allStringsTuned: '🎉 恭喜！当前乐器全部琴弦已校准完毕',
    nextUntunedString: '切换下一根待调弦',
    noisyAlertTitle: '检测到周围环境较嘈杂：',
    noisyAlertDesc: '外界谈话或背景噪音可能影响拾音，建议开启针对当前琴弦频段的强效降噪。',
    noisyAlertBtn: '一键开启强效降噪',
    ignoreBtn: '忽略',
  },
  en: {
    subtitle: 'Step 1: Select String · Step 2: Hold in ±5¢ Zone for Confirmation Chime',
    tabTuner: 'Pro Tuner',
    tabMetronome: 'Metronome & BPM',
    tabChords: 'Chord Library',
    tabEar: 'Ear Trainer',
    tabDecibel: 'dB Noise Meter',
    micOn: 'Listening',
    micOff: 'Start Mic',
    simOn: 'Stop Demo',
    simOff: 'Demo Pluck',
    noiseReductionOn: 'Noise Filter ON',
    noiseReductionOff: 'Noise Filter',
    step1SelectString: 'Step 1: Select the target string below (Locked to prevent jumping)',
    step2PluckAndHold: 'Step 2: Pluck & hold within ±5¢ zone for 0.9s to trigger confirmation chime',
    flatTighten: 'Flat · Tighten ▶',
    sharpLoosen: '◀ Sharp · Loosen',
    inTuneLocked: '✓ String Tuned! Confirmation Chime Played',
    holdingForLock: 'In ±5¢ Zone · Holding Stability...',
    waitingForString: 'Pluck the selected target string...',
    targetPitch: 'Locked Target String',
    measuredPitch: 'Measured Pitch',
    stringLockedBadge: 'Locked',
    modeManualTitle: 'Select String (Rec)',
    modeManualSub: 'Pick string first, then tune',
    modeAutoTitle: 'Auto Detect',
    modeAutoSub: 'Snap to closest string',
    modeSoundTitle: 'Sound Reference',
    modeSoundSub: 'Play acoustic tone',
    tuningVariantLabel: 'Tuning:',
    allStringsTuned: '🎉 All strings on this instrument are tuned!',
    nextUntunedString: 'Next Untuned String',
    noisyAlertTitle: 'Noisy Environment Detected:',
    noisyAlertDesc: 'Background chatter may interfere. Enable Narrow-Band Noise Suppression.',
    noisyAlertBtn: 'Enable Noise Filter',
    ignoreBtn: 'Dismiss',
  },
  ja: {
    subtitle: '1. 調律する弦を選択 · 2. ±5¢安定保持で完了チャイムが鳴ります',
    tabTuner: '高精度チューナー',
    tabMetronome: 'メトロノーム',
    tabChords: 'コード辞典',
    tabEar: '耳トレ & 音叉',
    tabDecibel: '騒音計 (dB)',
    micOn: '測定中',
    micOff: 'マイク開始',
    simOn: 'デモ停止',
    simOff: '調弦デモ',
    noiseReductionOn: '強力ノイズ除去中',
    noiseReductionOff: 'ノイズ除去',
    step1SelectString: 'ステップ1：調律する弦を選択してください（弦ロック済み）',
    step2PluckAndHold: 'ステップ2：弦を弾き、±5¢以内で0.9秒安定すると完了音が鳴ります',
    flatTighten: '低い · 締める ▶',
    sharpLoosen: '◀ 高い · 緩める',
    inTuneLocked: '✓ 調律完了！確認チャイム再生',
    holdingForLock: '±5¢圏内 · 安定保持カウント中...',
    waitingForString: '選択した弦を弾いてください...',
    targetPitch: 'ロック中の目標弦',
    measuredPitch: '実測周波数',
    stringLockedBadge: '弦固定',
    modeManualTitle: '弦指定モード (推奨)',
    modeManualSub: '弦を選んでから調律',
    modeAutoTitle: '自動認識モード',
    modeAutoSub: '近い弦を自動判定',
    modeSoundTitle: '基準音再生',
    modeSoundSub: 'リアル楽器音で耳調律',
    tuningVariantLabel: '調弦:',
    allStringsTuned: '🎉 すべての弦のチューニングが完了しました！',
    nextUntunedString: '次の未調律の弦へ',
    noisyAlertTitle: '周囲の騒音を検知しました：',
    noisyAlertDesc: '周囲の雑音を防ぐため、狭帯域ノイズ除去フィルターを有効にしてください。',
    noisyAlertBtn: 'ノイズ除去をON',
    ignoreBtn: '閉じる',
  },
};
