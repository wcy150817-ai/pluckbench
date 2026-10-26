import { SupportedLang } from '../i18n/localeTheme';

export type TemperamentId = 'equal' | 'pythagorean' | 'just' | 'meantone';
export type NotationStyle = 'letter' | 'solfege' | 'numbered';
export type TunerMode = 'tune-auto' | 'tune-manual' | 'sound-it';
export type ToneWaveform =
  | 'auto-instrument'
  | 'acoustic-guitar'
  | 'ukulele-nylon'
  | 'chinese-guzheng'
  | 'chinese-erhu'
  | 'chinese-pipa'
  | 'bowed-violin'
  | 'deep-bass'
  | 'grand-piano'
  | 'tuning-fork';

export type LocalizedText = Record<SupportedLang, string>;

export interface NoteInfo {
  midi: number;
  name: string;
  sharpName: string;
  octave: number;
  fullName: string;
  solfege: string;
  numbered: string;
  frequency: number;
}

export interface StringSpec {
  stringNumber: number;
  label: LocalizedText;
  noteName: string;
  midi: number;
  description?: LocalizedText;
}

export interface TuningVariant {
  id: string;
  name: LocalizedText;
  defaultTimbre?: Exclude<ToneWaveform, 'auto-instrument'>;
  strings: StringSpec[];
}

export interface InstrumentPreset {
  id: string;
  name: LocalizedText;
  category: 'chromatic' | 'plucked' | 'bowed' | 'chinese';
  defaultTimbre: Exclude<ToneWaveform, 'auto-instrument'>;
  minFreqHz: number;
  maxFreqHz: number;
  tunings: TuningVariant[];
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const SOLFEGE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'] as const;
export const NUMBERED_NAMES = ['1', '#1', '2', '#2', '3', '4', '#4', '5', '#5', '6', '#6', '7'] as const;

export const TIMBRE_OPTIONS: {
  id: ToneWaveform;
  name: LocalizedText;
  badge: LocalizedText;
}[] = [
  {
    id: 'auto-instrument',
    name: { zh: '智能跟随当前乐器原声', en: 'Auto Match Instrument', ja: '楽器に合わせて自動選択' },
    badge: { zh: '物理建模推荐', en: 'Recommended', ja: '物理モデリング推奨' },
  },
  {
    id: 'acoustic-guitar',
    name: { zh: '原声木吉他', en: 'Acoustic Guitar', ja: 'アコースティックギター' },
    badge: { zh: '云杉箱体共鸣', en: 'Spruce Body', ja: '箱鳴り共鳴' },
  },
  {
    id: 'chinese-guzheng',
    name: { zh: '古筝桐木共鸣', en: 'Guzheng Zither', ja: '古筝（桐木共鳴）' },
    badge: { zh: '义甲拨弦泛音', en: 'Plucked Zither', ja: '義甲撥弦音' },
  },
  {
    id: 'chinese-erhu',
    name: { zh: '二胡蟒皮琴筒', en: 'Erhu Bowed Fiddle', ja: '二胡（擦弦共鳴）' },
    badge: { zh: '弓弦揉弦模拟', en: 'Bowed & Vibrato', ja: 'ビブラート擦弦' },
  },
  {
    id: 'chinese-pipa',
    name: { zh: '琵琶与中阮弹拨', en: 'Pipa & Ruan Lute', ja: '琵琶・中阮' },
    badge: { zh: '珠玉清脆面板', en: 'Crisp Lute Attack', ja: '粒立ちの良い撥弦' },
  },
  {
    id: 'bowed-violin',
    name: { zh: '提琴木质弓弦', en: 'Violin & Cello', ja: 'バイオリン・チェロ' },
    badge: { zh: '琴桥共振峰', en: 'Cremona Bridge', ja: '木製胴共鳴' },
  },
  {
    id: 'ukulele-nylon',
    name: { zh: '尤克里里尼龙弦', en: 'Ukulele Nylon', ja: 'ウクレレ（ナイロン弦）' },
    badge: { zh: '相思木温暖拨弦', en: 'Warm Koa Nylon', ja: '温かみのある音色' },
  },
  {
    id: 'deep-bass',
    name: { zh: '贝斯浑厚低音', en: 'Acoustic & Electric Bass', ja: 'ベース（重低音）' },
    badge: { zh: '缠弦低频激励', en: 'Deep Wound String', ja: 'ラウンドワウンド弦' },
  },
  {
    id: 'grand-piano',
    name: { zh: '三角钢琴击弦', en: 'Concert Grand Piano', ja: 'グランドピアノ' },
    badge: { zh: '琴槌泛音包络', en: 'Hammer Harmonics', ja: 'ハンマー打弦音' },
  },
  {
    id: 'tuning-fork',
    name: { zh: '实验室纯音叉', en: 'Pure Tuning Fork', ja: '純音叉 (440Hz)' },
    badge: { zh: '标准正弦波', en: 'Pure Sine Wave', ja: '純粋な正弦波' },
  },
];

const TEMPERAMENT_OFFSETS_FROM_C: Record<TemperamentId, number[]> = {
  equal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  just: [0, 11.73, 3.91, 15.64, -13.69, -1.96, -9.78, 1.96, 13.69, -15.64, 17.6, -11.73],
  pythagorean: [0, -9.78, 3.91, -5.87, 7.82, -1.96, -11.73, 1.96, -7.82, 5.87, -3.91, 9.78],
  meantone: [0, -24.0, -6.8, 10.3, -13.7, 3.4, -20.5, -3.4, -27.4, -10.3, 6.8, -17.1],
};

export const TEMPERAMENTS: {
  id: TemperamentId;
  name: LocalizedText;
  desc: LocalizedText;
}[] = [
  {
    id: 'equal',
    name: { zh: '十二平均律', en: 'Equal Temperament (12-TET)', ja: '十二平均律' },
    desc: {
      zh: '现代通用标准律制，适用于吉他、钢琴与大多数合奏场景',
      en: 'Modern universal standard for guitar, piano, and ensemble playing',
      ja: 'ギターやピアノ、アンサンブルに最適な現代標準音律',
    },
  },
  {
    id: 'pythagorean',
    name: { zh: '五度相生律', en: 'Pythagorean Tuning', ja: 'ピタゴラス音律（五度相生律）' },
    desc: {
      zh: '纯五度谐振，适合二胡、古筝、琵琶等民乐及提琴独奏',
      en: 'Pure 3:2 fifths, ideal for solo violin, cello, erhu, and guzheng',
      ja: '純粋な完全五度共鳴、バイオリン独奏や二胡・古筝に最適',
    },
  },
  {
    id: 'just',
    name: { zh: '纯律', en: 'Just Intonation', ja: '純正律' },
    desc: {
      zh: '自然泛音整数比，和弦极度纯净，适合无伴奏合唱与室内乐',
      en: 'Pure harmonic ratios for beatless triads and chamber music',
      ja: '自然倍音の整数比による澄み切った和音、合唱や室内楽向け',
    },
  },
  {
    id: 'meantone',
    name: { zh: '中庸全音律', en: 'Quarter-Comma Meantone', ja: '中全音律（ミーントーン）' },
    desc: {
      zh: '文艺复兴与早期巴洛克古典键盘与古乐常用律制',
      en: 'Historical temperament for Renaissance and Baroque music',
      ja: 'ルネサンスや初期バロック音楽に適した古典音律',
    },
  },
];

export function midiToFrequency(
  midi: number,
  a4Hz: number = 440,
  temperament: TemperamentId = 'equal'
): number {
  const noteClass = ((midi % 12) + 12) % 12;
  const offsets = TEMPERAMENT_OFFSETS_FROM_C[temperament];
  const centOffset = offsets[noteClass] - offsets[9];
  const equalFreq = a4Hz * Math.pow(2, (midi - 69) / 12);
  return equalFreq * Math.pow(2, centOffset / 1200);
}

export function frequencyToFloatMidi(freq: number, a4Hz: number = 440): number {
  return 69 + 12 * Math.log2(freq / a4Hz);
}

export function getCentsOffset(measuredHz: number, targetHz: number): number {
  if (measuredHz <= 0 || targetHz <= 0) return 0;
  return 1200 * Math.log2(measuredHz / targetHz);
}

export function getFreqAtCents(targetHz: number, cents: number): number {
  return targetHz * Math.pow(2, cents / 1200);
}

export function getNoteInfo(
  midi: number,
  a4Hz: number = 440,
  temperament: TemperamentId = 'equal'
): NoteInfo {
  const clampedMidi = Math.max(12, Math.min(119, Math.round(midi)));
  const noteIndex = ((clampedMidi % 12) + 12) % 12;
  const octave = Math.floor(clampedMidi / 12) - 1;
  const name = NOTE_NAMES[noteIndex];
  const solfege = SOLFEGE_NAMES[noteIndex];
  const numbered = NUMBERED_NAMES[noteIndex];
  const frequency = midiToFrequency(clampedMidi, a4Hz, temperament);

  return {
    midi: clampedMidi,
    name,
    sharpName: name,
    octave,
    fullName: `${name}${octave}`,
    solfege,
    numbered,
    frequency,
  };
}

export function formatNoteDisplay(
  note: NoteInfo,
  style: NotationStyle,
  lang: SupportedLang = 'zh'
): { primary: string; secondary: string } {
  const numPrefix = lang === 'zh' ? '简谱' : lang === 'ja' ? '数字譜' : 'Scale';
  if (style === 'solfege') {
    return {
      primary: `${note.solfege}${note.octave}`,
      secondary: `${note.fullName} · ${numPrefix} ${note.numbered}`,
    };
  }
  if (style === 'numbered') {
    return {
      primary: `${note.numbered}`,
      secondary: `${note.fullName} (${note.solfege}${note.octave})`,
    };
  }
  return {
    primary: note.fullName,
    secondary: `${note.solfege} · ${numPrefix} ${note.numbered}`,
  };
}

function makeStr(
  num: number,
  noteName: string,
  midi: number,
  zhLbl: string,
  enLbl: string,
  jaLbl: string,
  zhDesc?: string,
  enDesc?: string,
  jaDesc?: string
): StringSpec {
  return {
    stringNumber: num,
    noteName,
    midi,
    label: { zh: zhLbl, en: enLbl, ja: jaLbl },
    description: zhDesc
      ? { zh: zhDesc, en: enDesc || zhDesc, ja: jaDesc || zhDesc }
      : undefined,
  };
}

export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: 'guitar',
    name: { zh: '吉他', en: 'Guitar', ja: 'ギター' },
    category: 'plucked',
    defaultTimbre: 'acoustic-guitar',
    minFreqHz: 65,
    maxFreqHz: 420,
    tunings: [
      {
        id: 'guitar-standard',
        name: {
          zh: '六弦标准定弦 (E2-A2-D3-G3-B3-E4)',
          en: '6-String Standard (E2-A2-D3-G3-B3-E4)',
          ja: '6弦レギュラー (E2-A2-D3-G3-B3-E4)',
        },
        defaultTimbre: 'acoustic-guitar',
        strings: [
          makeStr(6, 'E2', 40, '6弦 E2', '6th E2', '6弦 E2', '六弦低音', 'Low E String', '6弦（最低音）'),
          makeStr(5, 'A2', 45, '5弦 A2', '5th A2', '5弦 A2', '五弦', 'A String', '5弦'),
          makeStr(4, 'D3', 50, '4弦 D3', '4th D3', '4弦 D3', '四弦', 'D String', '4弦'),
          makeStr(3, 'G3', 55, '3弦 G3', '3rd G3', '3弦 G3', '三弦', 'G String', '3弦'),
          makeStr(2, 'B3', 59, '2弦 B3', '2nd B3', '2弦 B3', '二弦', 'B String', '2弦'),
          makeStr(1, 'E4', 64, '1弦 E4', '1st E4', '1弦 E4', '一弦高音', 'High E String', '1弦（最高音）'),
        ],
      },
      {
        id: 'guitar-drop-d',
        name: {
          zh: '六弦降D定弦 (D2-A2-D3-G3-B3-E4)',
          en: 'Drop D Tuning (D2-A2-D3-G3-B3-E4)',
          ja: 'ドロップD (D2-A2-D3-G3-B3-E4)',
        },
        defaultTimbre: 'acoustic-guitar',
        strings: [
          makeStr(6, 'D2', 38, '6弦 D2', '6th D2', '6弦 D2'),
          makeStr(5, 'A2', 45, '5弦 A2', '5th A2', '5弦 A2'),
          makeStr(4, 'D3', 50, '4弦 D3', '4th D3', '4弦 D3'),
          makeStr(3, 'G3', 55, '3弦 G3', '3rd G3', '3弦 G3'),
          makeStr(2, 'B3', 59, '2弦 B3', '2nd B3', '2弦 B3'),
          makeStr(1, 'E4', 64, '1弦 E4', '1st E4', '1弦 E4'),
        ],
      },
      {
        id: 'guitar-half-down',
        name: {
          zh: '全弦降半音 (D#2-G#2-C#3-F#3-A#3-D#4)',
          en: 'Half-Step Down Eb (D#2-G#2-C#3-F#3-A#3-D#4)',
          ja: '半音下げ (D#2-G#2-C#3-F#3-A#3-D#4)',
        },
        defaultTimbre: 'acoustic-guitar',
        strings: [
          makeStr(6, 'D#2', 39, '6弦 D#2', '6th D#2', '6弦 D#2'),
          makeStr(5, 'G#2', 44, '5弦 G#2', '5th G#2', '5弦 G#2'),
          makeStr(4, 'C#3', 49, '4弦 C#3', '4th C#3', '4弦 C#3'),
          makeStr(3, 'F#3', 54, '3弦 F#3', '3rd F#3', '3弦 F#3'),
          makeStr(2, 'A#3', 58, '2弦 A#3', '2nd A#3', '2弦 A#3'),
          makeStr(1, 'D#4', 63, '1弦 D#4', '1st D#4', '1弦 D#4'),
        ],
      },
    ],
  },
  {
    id: 'ukulele',
    name: { zh: '尤克里里', en: 'Ukulele', ja: 'ウクレレ' },
    category: 'plucked',
    defaultTimbre: 'ukulele-nylon',
    minFreqHz: 170,
    maxFreqHz: 560,
    tunings: [
      {
        id: 'ukulele-standard',
        name: {
          zh: '标准高音G定弦 (G4-C4-E4-A4)',
          en: 'Standard High-G (G4-C4-E4-A4)',
          ja: '標準 High-G (G4-C4-E4-A4)',
        },
        defaultTimbre: 'ukulele-nylon',
        strings: [
          makeStr(4, 'G4', 67, '4弦 G4', '4th G4', '4弦 G4'),
          makeStr(3, 'C4', 60, '3弦 C4', '3rd C4', '3弦 C4'),
          makeStr(2, 'E4', 64, '2弦 E4', '2nd E4', '2弦 E4'),
          makeStr(1, 'A4', 69, '1弦 A4', '1st A4', '1弦 A4'),
        ],
      },
      {
        id: 'ukulele-low-g',
        name: {
          zh: '低音G指弹定弦 (G3-C4-E4-A4)',
          en: 'Low-G Fingerstyle (G3-C4-E4-A4)',
          ja: 'Low-G チューニング (G3-C4-E4-A4)',
        },
        defaultTimbre: 'ukulele-nylon',
        strings: [
          makeStr(4, 'G3', 55, '4弦 G3', '4th G3', '4弦 G3'),
          makeStr(3, 'C4', 60, '3弦 C4', '3rd C4', '3弦 C4'),
          makeStr(2, 'E4', 64, '2弦 E4', '2nd E4', '2弦 E4'),
          makeStr(1, 'A4', 69, '1弦 A4', '1st A4', '1弦 A4'),
        ],
      },
    ],
  },
  {
    id: 'bass',
    name: { zh: '贝斯', en: 'Bass', ja: 'ベース' },
    category: 'plucked',
    defaultTimbre: 'deep-bass',
    minFreqHz: 27.5,
    maxFreqHz: 180,
    tunings: [
      {
        id: 'bass-4',
        name: {
          zh: '四弦标准贝斯 (E1-A1-D2-G2)',
          en: '4-String Standard Bass (E1-A1-D2-G2)',
          ja: '4弦標準ベース (E1-A1-D2-G2)',
        },
        defaultTimbre: 'deep-bass',
        strings: [
          makeStr(4, 'E1', 28, '4弦 E1', '4th E1', '4弦 E1'),
          makeStr(3, 'A1', 33, '3弦 A1', '3rd A1', '3弦 A1'),
          makeStr(2, 'D2', 38, '2弦 D2', '2nd D2', '2弦 D2'),
          makeStr(1, 'G2', 43, '1弦 G2', '1st G2', '1弦 G2'),
        ],
      },
      {
        id: 'bass-5',
        name: {
          zh: '五弦标准贝斯 (B0-E1-A1-D2-G2)',
          en: '5-String Bass (B0-E1-A1-D2-G2)',
          ja: '5弦標準ベース (B0-E1-A1-D2-G2)',
        },
        defaultTimbre: 'deep-bass',
        strings: [
          makeStr(5, 'B0', 23, '5弦 B0', '5th B0', '5弦 B0'),
          makeStr(4, 'E1', 28, '4弦 E1', '4th E1', '4弦 E1'),
          makeStr(3, 'A1', 33, '3弦 A1', '3rd A1', '3弦 A1'),
          makeStr(2, 'D2', 38, '2弦 D2', '2nd D2', '2弦 D2'),
          makeStr(1, 'G2', 43, '1弦 G2', '1st G2', '1弦 G2'),
        ],
      },
    ],
  },
  {
    id: 'violin-family',
    name: { zh: '提琴', en: 'Violin & Cello', ja: 'バイオリン・チェロ' },
    category: 'bowed',
    defaultTimbre: 'bowed-violin',
    minFreqHz: 58,
    maxFreqHz: 880,
    tunings: [
      {
        id: 'violin-standard',
        name: {
          zh: '小提琴标准定弦 (G3-D4-A4-E5)',
          en: 'Violin Standard (G3-D4-A4-E5)',
          ja: 'バイオリン標準 (G3-D4-A4-E5)',
        },
        defaultTimbre: 'bowed-violin',
        strings: [
          makeStr(4, 'G3', 55, '4弦 G3', '4th G3', '4弦 G3'),
          makeStr(3, 'D4', 62, '3弦 D4', '3rd D4', '3弦 D4'),
          makeStr(2, 'A4', 69, '2弦 A4', '2nd A4', '2弦 A4'),
          makeStr(1, 'E5', 76, '1弦 E5', '1st E5', '1弦 E5'),
        ],
      },
      {
        id: 'cello-standard',
        name: {
          zh: '大提琴标准定弦 (C2-G2-D3-A3)',
          en: 'Cello Standard (C2-G2-D3-A3)',
          ja: 'チェロ標準 (C2-G2-D3-A3)',
        },
        defaultTimbre: 'bowed-violin',
        strings: [
          makeStr(4, 'C2', 36, '4弦 C2', '4th C2', '4弦 C2'),
          makeStr(3, 'G2', 43, '3弦 G2', '3rd G2', '3弦 G2'),
          makeStr(2, 'D3', 50, '2弦 D3', '2nd D3', '2弦 D3'),
          makeStr(1, 'A3', 57, '1弦 A3', '1st A3', '1弦 A3'),
        ],
      },
    ],
  },
  {
    id: 'guzheng',
    name: { zh: '古筝', en: 'Guzheng', ja: '古筝' },
    category: 'chinese',
    defaultTimbre: 'chinese-guzheng',
    minFreqHz: 65,
    maxFreqHz: 1350,
    tunings: [
      {
        id: 'guzheng-d-core',
        name: {
          zh: '古筝D调中音与绿弦核心组',
          en: 'Guzheng D-Major Core & Green Strings',
          ja: '古筝 D調（緑弦・中音域コア）',
        },
        defaultTimbre: 'chinese-guzheng',
        strings: [
          makeStr(18, 'A2', 45, '18弦 A2(绿)', '18th A2(Grn)', '18弦 A2(緑)'),
          makeStr(16, 'D3', 50, '16弦 D3', '16th D3', '16弦 D3'),
          makeStr(13, 'A3', 57, '13弦 A3(绿)', '13th A3(Grn)', '13弦 A3(緑)'),
          makeStr(11, 'D4', 62, '11弦 D4', '11th D4', '11弦 D4'),
          makeStr(10, 'E4', 64, '10弦 E4', '10th E4', '10弦 E4'),
          makeStr(9, 'F#4', 66, '9弦 F#4', '9th F#4', '9弦 F#4'),
          makeStr(8, 'A4', 69, '8弦 A4(绿)', '8th A4(Grn)', '8弦 A4(緑)'),
          makeStr(6, 'D5', 74, '6弦 D5', '6th D5', '6弦 D5'),
          makeStr(3, 'A5', 81, '3弦 A5(绿)', '3rd A5(Grn)', '3弦 A5(緑)'),
        ],
      },
      {
        id: 'guzheng-d-21',
        name: {
          zh: '古筝D调 21弦完整定弦 (21弦~1弦)',
          en: 'Guzheng D-Major Full 21 Strings',
          ja: '古筝 D調 全21弦セット',
        },
        defaultTimbre: 'chinese-guzheng',
        strings: [
          makeStr(21, 'D2', 38, '21弦 D2', '21st D2', '21弦 D2'),
          makeStr(20, 'E2', 40, '20弦 E2', '20th E2', '20弦 E2'),
          makeStr(19, 'F#2', 42, '19弦 F#2', '19th F#2', '19弦 F#2'),
          makeStr(18, 'A2', 45, '18弦 A2(绿)', '18th A2(Grn)', '18弦 A2(緑)'),
          makeStr(17, 'B2', 47, '17弦 B2', '17th B2', '17弦 B2'),
          makeStr(16, 'D3', 50, '16弦 D3', '16th D3', '16弦 D3'),
          makeStr(15, 'E3', 52, '15弦 E3', '15th E3', '15弦 E3'),
          makeStr(14, 'F#3', 54, '14弦 F#3', '14th F#3', '14弦 F#3'),
          makeStr(13, 'A3', 57, '13弦 A3(绿)', '13th A3(Grn)', '13弦 A3(緑)'),
          makeStr(12, 'B3', 59, '12弦 B3', '12th B3', '12弦 B3'),
          makeStr(11, 'D4', 62, '11弦 D4', '11th D4', '11弦 D4'),
          makeStr(10, 'E4', 64, '10弦 E4', '10th E4', '10弦 E4'),
          makeStr(9, 'F#4', 66, '9弦 F#4', '9th F#4', '9弦 F#4'),
          makeStr(8, 'A4', 69, '8弦 A4(绿)', '8th A4(Grn)', '8弦 A4(緑)'),
          makeStr(7, 'B4', 71, '7弦 B4', '7th B4', '7弦 B4'),
          makeStr(6, 'D5', 74, '6弦 D5', '6th D5', '6弦 D5'),
          makeStr(5, 'E5', 76, '5弦 E5', '5th E5', '5弦 E5'),
          makeStr(4, 'F#5', 78, '4弦 F#5', '4th F#5', '4弦 F#5'),
          makeStr(3, 'A5', 81, '3弦 A5(绿)', '3rd A5(Grn)', '3弦 A5(緑)'),
          makeStr(2, 'B5', 83, '2弦 B5', '2nd B5', '2弦 B5'),
          makeStr(1, 'D6', 86, '1弦 D6', '1st D6', '1弦 D6'),
        ],
      },
    ],
  },
  {
    id: 'erhu-pipa',
    name: { zh: '二胡与琵琶', en: 'Erhu & Pipa', ja: '二胡・琵琶' },
    category: 'chinese',
    defaultTimbre: 'chinese-erhu',
    minFreqHz: 85,
    maxFreqHz: 920,
    tunings: [
      {
        id: 'erhu-standard',
        name: {
          zh: '二胡标准定弦 (里弦D4 · 外弦A4)',
          en: 'Erhu Standard (Inner D4 · Outer A4)',
          ja: '二胡 標準調弦 (内弦D4 · 外弦A4)',
        },
        defaultTimbre: 'chinese-erhu',
        strings: [
          makeStr(2, 'D4', 62, '里弦 D4', 'Inner D4', '内弦 D4'),
          makeStr(1, 'A4', 69, '外弦 A4', 'Outer A4', '外弦 A4'),
        ],
      },
      {
        id: 'pipa-standard',
        name: {
          zh: '琵琶标准定弦 (A2-D3-E3-A3)',
          en: 'Pipa Standard (A2-D3-E3-A3)',
          ja: '琵琶 標準調弦 (A2-D3-E3-A3)',
        },
        defaultTimbre: 'chinese-pipa',
        strings: [
          makeStr(4, 'A2', 45, '4弦 缠弦 A2', '4th A2', '4弦 A2'),
          makeStr(3, 'D3', 50, '3弦 老弦 D3', '3rd D3', '3弦 D3'),
          makeStr(2, 'E3', 52, '2弦 中弦 E3', '2nd E3', '2弦 E3'),
          makeStr(1, 'A3', 57, '1弦 子弦 A3', '1st A3', '1弦 A3'),
        ],
      },
    ],
  },
  {
    id: 'chromatic',
    name: { zh: '半音阶通用', en: 'Chromatic', ja: 'クロマチック' },
    category: 'chromatic',
    defaultTimbre: 'grand-piano',
    minFreqHz: 27.5,
    maxFreqHz: 2200,
    tunings: [
      {
        id: 'chromatic-standard',
        name: {
          zh: '十二半音阶基准音组 (C3 ~ C5)',
          en: 'Chromatic Reference Notes (C3 ~ C5)',
          ja: 'クロマチック基準音 (C3 ~ C5)',
        },
        defaultTimbre: 'grand-piano',
        strings: [
          makeStr(1, 'C3', 48, '低音 C3', 'Low C3', '低音 C3'),
          makeStr(2, 'G3', 55, '低音 G3', 'Low G3', '低音 G3'),
          makeStr(3, 'C4', 60, '中央 C4', 'Middle C4', '中央 C4'),
          makeStr(4, 'E4', '64' as unknown as number, '中音 E4', 'Mid E4', '中音 E4'),
          makeStr(5, 'G4', 67, '中音 G4', 'Mid G4', '中音 G4'),
          makeStr(6, 'A4', 69, '标准音 A4', 'Concert A4', '基準音 A4'),
        ].map((s) => ({ ...s, midi: Number(s.midi) })),
      },
    ],
  },
];
