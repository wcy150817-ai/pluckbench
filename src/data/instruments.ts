export type TemperamentId = 'equal' | 'pythagorean' | 'just' | 'meantone';
export type NotationStyle = 'letter' | 'solfege' | 'numbered';
export type TunerMode = 'tune-auto' | 'tune-manual' | 'sound-it';
export type ToneWaveform = 'plucked' | 'sine' | 'triangle' | 'organ';

export interface NoteInfo {
  midi: number;
  name: string;        // e.g. "A"
  sharpName: string;   // e.g. "A#"
  octave: number;      // e.g. 4
  fullName: string;    // e.g. "A4"
  solfege: string;     // e.g. "La"
  numbered: string;    // e.g. "6"
  frequency: number;   // Target frequency in Hz
}

export interface StringSpec {
  stringNumber: number; // 1 = highest pitch string (traditional guitar/violin numbering) or sequential
  label: string;        // e.g. "1弦 E4" or "内弦 D4"
  noteName: string;     // e.g. "E4"
  midi: number;
  description?: string; // e.g. "细弦 / 一弦"
}

export interface TuningVariant {
  id: string;
  name: string;
  subtitle: string;
  strings: StringSpec[];
}

export interface InstrumentPreset {
  id: string;
  name: string;
  category: 'chromatic' | 'plucked' | 'bowed' | 'chinese';
  categoryLabel: string;
  iconName: string;
  description: string;
  tunings: TuningVariant[];
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const SOLFEGE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'] as const;
export const NUMBERED_NAMES = ['1', '#1', '2', '#2', '3', '4', '#4', '5', '#5', '6', '#6', '7'] as const;

/**
 * Temperament cent offsets relative to 12-TET (root C, normalized to A)
 */
const TEMPERAMENT_OFFSETS_FROM_C: Record<TemperamentId, number[]> = {
  equal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Five-limit Just Intonation (relative to C major scale)
  just: [0, 11.73, 3.91, 15.64, -13.69, -1.96, -9.78, 1.96, 13.69, -15.64, 17.6, -11.73],
  // Pythagorean tuning (pure 3:2 fifths, widely favored in Chinese Erhu/Guzheng & solo strings)
  pythagorean: [0, -9.78, 3.91, -5.87, 7.82, -1.96, -11.73, 1.96, -7.82, 5.87, -3.91, 9.78],
  // Quarter-comma Meantone
  meantone: [0, -24.0, -6.8, 10.3, -13.7, 3.4, -20.5, -3.4, -27.4, -10.3, 6.8, -17.1],
};

export const TEMPERAMENTS: { id: TemperamentId; name: string; desc: string }[] = [
  { id: 'equal', name: '十二平均律 (12-TET)', desc: '现代通用标准律制，适用于吉他、钢琴与大多数合奏场景' },
  { id: 'pythagorean', name: '五度相生律 (Pythagorean)', desc: '纯五度谐振，适合二胡、古筝、琵琶等民乐及提琴独奏' },
  { id: 'just', name: '纯律 (Just Intonation)', desc: '自然泛音整数比，和弦极度纯净，适合无伴奏合唱与室内乐' },
  { id: 'meantone', name: '中庸全音律 (Meantone)', desc: '文艺复兴与早期巴洛克古典键盘/管弦乐常用律制' },
];

/**
 * Compute exact target frequency for a MIDI note given A4 reference pitch and temperament
 */
export function midiToFrequency(
  midi: number,
  a4Hz: number = 440,
  temperament: TemperamentId = 'equal'
): number {
  const noteClass = ((midi % 12) + 12) % 12;
  const offsets = TEMPERAMENT_OFFSETS_FROM_C[temperament];
  // Anchor A4 (midi 69, noteClass 9) to exact a4Hz
  const centOffset = offsets[noteClass] - offsets[9];
  const equalFreq = a4Hz * Math.pow(2, (midi - 69) / 12);
  return equalFreq * Math.pow(2, centOffset / 1200);
}

/**
 * Convert frequency (Hz) to floating-point MIDI note number
 */
export function frequencyToFloatMidi(freq: number, a4Hz: number = 440): number {
  return 69 + 12 * Math.log2(freq / a4Hz);
}

/**
 * Calculate cent deviation between measured frequency and target frequency
 * 1 semitone = 100 cents, 1 octave = 1200 cents
 */
export function getCentsOffset(measuredHz: number, targetHz: number): number {
  if (measuredHz <= 0 || targetHz <= 0) return 0;
  return 1200 * Math.log2(measuredHz / targetHz);
}

/**
 * Calculate frequency at a given cents offset from targetHz (for gStrings inner Hz scale)
 */
export function getFreqAtCents(targetHz: number, cents: number): number {
  return targetHz * Math.pow(2, cents / 1200);
}

/**
 * Build rich NoteInfo for any integer MIDI number
 */
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

/**
 * Format note display label according to user preference
 */
export function formatNoteDisplay(note: NoteInfo, style: NotationStyle): { primary: string; secondary: string } {
  if (style === 'solfege') {
    return {
      primary: `${note.solfege}${note.octave}`,
      secondary: `${note.fullName} · 简谱 ${note.numbered}`,
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
    secondary: `${note.solfege} · 简谱 ${note.numbered}`,
  };
}

export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: 'chromatic',
    name: '半音阶通用',
    category: 'chromatic',
    categoryLabel: '全音域通用',
    iconName: 'Compass',
    description: 'gStrings 经典全音域半音阶模式（C1 - B7），适用于钢琴、管乐、人声及任意乐器',
    tunings: [
      {
        id: 'chromatic-standard',
        name: '12半音阶全音域 (C1 ~ B7)',
        subtitle: '自动识别全部半音，亦可快速点选常用基准音',
        strings: [
          { stringNumber: 1, label: 'C3 低音Do', noteName: 'C3', midi: 48, description: '130.8 Hz' },
          { stringNumber: 2, label: 'G3 低音Sol', noteName: 'G3', midi: 55, description: '196.0 Hz' },
          { stringNumber: 3, label: 'C4 中央C', noteName: 'C4', midi: 60, description: '261.6 Hz' },
          { stringNumber: 4, label: 'E4 中音Mi', noteName: 'E4', midi: 64, description: '329.6 Hz' },
          { stringNumber: 5, label: 'G4 中音Sol', noteName: 'G4', midi: 67, description: '392.0 Hz' },
          { stringNumber: 6, label: 'A4 标准音', noteName: 'A4', midi: 69, description: '440.0 Hz' },
          { stringNumber: 7, label: 'C5 高音Do', noteName: 'C5', midi: 72, description: '523.3 Hz' },
        ],
      },
    ],
  },
  {
    id: 'guitar',
    name: '吉他 Guitar',
    category: 'plucked',
    categoryLabel: '西洋弹拨',
    iconName: 'Guitar',
    description: '民谣吉他 / 电吉他 / 古典吉他，支持标准调弦、Drop D、降半音与指弹开放调弦',
    tunings: [
      {
        id: 'guitar-standard',
        name: '6弦标准调弦 (Standard EADGBE)',
        subtitle: '6弦 E2 → 1弦 E4',
        strings: [
          { stringNumber: 6, label: '6弦 E2', noteName: 'E2', midi: 40, description: '最粗低音弦' },
          { stringNumber: 5, label: '5弦 A2', noteName: 'A2', midi: 45, description: '五弦' },
          { stringNumber: 4, label: '4弦 D3', noteName: 'D3', midi: 50, description: '四弦' },
          { stringNumber: 3, label: '3弦 G3', noteName: 'G3', midi: 55, description: '三弦' },
          { stringNumber: 2, label: '2弦 B3', noteName: 'B3', midi: 59, description: '二弦' },
          { stringNumber: 1, label: '1弦 E4', noteName: 'E4', midi: 64, description: '最细高音弦' },
        ],
      },
      {
        id: 'guitar-drop-d',
        name: 'Drop D 调弦 (DADGBE)',
        subtitle: '6弦降全音至 D2，摇滚/金属/指弹常用',
        strings: [
          { stringNumber: 6, label: '6弦 D2', noteName: 'D2', midi: 38, description: '降全音低音弦' },
          { stringNumber: 5, label: '5弦 A2', noteName: 'A2', midi: 45, description: '五弦' },
          { stringNumber: 4, label: '4弦 D3', noteName: 'D3', midi: 50, description: '四弦' },
          { stringNumber: 3, label: '3弦 G3', noteName: 'G3', midi: 55, description: '三弦' },
          { stringNumber: 2, label: '2弦 B3', noteName: 'B3', midi: 59, description: '二弦' },
          { stringNumber: 1, label: '1弦 E4', noteName: 'E4', midi: 64, description: '一弦' },
        ],
      },
      {
        id: 'guitar-half-down',
        name: '降半音调弦 (Eb Standard)',
        subtitle: '全弦降低半音 (D#2 G#2 C#3 F#3 A#3 D#4)',
        strings: [
          { stringNumber: 6, label: '6弦 D#2', noteName: 'D#2', midi: 39, description: 'Eb2' },
          { stringNumber: 5, label: '5弦 G#2', noteName: 'G#2', midi: 44, description: 'Ab2' },
          { stringNumber: 4, label: '4弦 C#3', noteName: 'C#3', midi: 49, description: 'Db3' },
          { stringNumber: 3, label: '3弦 F#3', noteName: 'F#3', midi: 54, description: 'Gb3' },
          { stringNumber: 2, label: '2弦 A#3', noteName: 'A#3', midi: 58, description: 'Bb3' },
          { stringNumber: 1, label: '1弦 D#4', noteName: 'D#4', midi: 63, description: 'Eb4' },
        ],
      },
      {
        id: 'guitar-dadgad',
        name: 'DADGAD 凯尔特/指弹调弦',
        subtitle: '指弹吉他经典开放调弦 (D2 A2 D3 G3 A3 D4)',
        strings: [
          { stringNumber: 6, label: '6弦 D2', noteName: 'D2', midi: 38, description: '六弦' },
          { stringNumber: 5, label: '5弦 A2', noteName: 'A2', midi: 45, description: '五弦' },
          { stringNumber: 4, label: '4弦 D3', noteName: 'D3', midi: 50, description: '四弦' },
          { stringNumber: 3, label: '3弦 G3', noteName: 'G3', midi: 55, description: '三弦' },
          { stringNumber: 2, label: '2弦 A3', noteName: 'A3', midi: 57, description: '二弦' },
          { stringNumber: 1, label: '1弦 D4', noteName: 'D4', midi: 62, description: '一弦' },
        ],
      },
    ],
  },
  {
    id: 'ukulele',
    name: '尤克里里 Ukulele',
    category: 'plucked',
    categoryLabel: '西洋弹拨',
    iconName: 'Music2',
    description: '支持标准高音 G (High-G)、低音 G (Low-G) 以及传统 D 调定弦',
    tunings: [
      {
        id: 'ukulele-standard',
        name: '标准高音G (High-G: G4 C4 E4 A4)',
        subtitle: '最常用的尤克里里C调标准定弦',
        strings: [
          { stringNumber: 4, label: '4弦 G4', noteName: 'G4', midi: 67, description: '高音G四弦' },
          { stringNumber: 3, label: '3弦 C4', noteName: 'C4', midi: 60, description: '最粗三弦' },
          { stringNumber: 2, label: '2弦 E4', noteName: 'E4', midi: 64, description: '二弦' },
          { stringNumber: 1, label: '1弦 A4', noteName: 'A4', midi: 69, description: '高音一弦' },
        ],
      },
      {
        id: 'ukulele-low-g',
        name: '低音G指弹 (Low-G: G3 C4 E4 A4)',
        subtitle: '4弦更换为低八度G3，扩展低音音域',
        strings: [
          { stringNumber: 4, label: '4弦 G3', noteName: 'G3', midi: 55, description: '低音G四弦' },
          { stringNumber: 3, label: '3弦 C4', noteName: 'C4', midi: 60, description: '三弦' },
          { stringNumber: 2, label: '2弦 E4', noteName: 'E4', midi: 64, description: '二弦' },
          { stringNumber: 1, label: '1弦 A4', noteName: 'A4', midi: 69, description: '一弦' },
        ],
      },
    ],
  },
  {
    id: 'bass',
    name: '贝斯 Bass',
    category: 'plucked',
    categoryLabel: '西洋弹拨',
    iconName: 'Waves',
    description: '针对低频基音与泛音优化，支持 4 弦与 5 弦电贝斯/木贝斯',
    tunings: [
      {
        id: 'bass-4',
        name: '4弦标准贝斯 (E1 A1 D2 G2)',
        subtitle: '4弦 E1 (41.2Hz) → 1弦 G2 (98.0Hz)',
        strings: [
          { stringNumber: 4, label: '4弦 E1', noteName: 'E1', midi: 28, description: '41.2 Hz 超低音' },
          { stringNumber: 3, label: '3弦 A1', noteName: 'A1', midi: 33, description: '55.0 Hz' },
          { stringNumber: 2, label: '2弦 D2', noteName: 'D2', midi: 38, description: '73.4 Hz' },
          { stringNumber: 1, label: '1弦 G2', noteName: 'G2', midi: 43, description: '98.0 Hz' },
        ],
      },
      {
        id: 'bass-5',
        name: '5弦标准贝斯 (B0 E1 A1 D2 G2)',
        subtitle: '含 5弦 B0 (30.9Hz)',
        strings: [
          { stringNumber: 5, label: '5弦 B0', noteName: 'B0', midi: 23, description: '30.9 Hz 极低音' },
          { stringNumber: 4, label: '4弦 E1', noteName: 'E1', midi: 28, description: '41.2 Hz' },
          { stringNumber: 3, label: '3弦 A1', noteName: 'A1', midi: 33, description: '55.0 Hz' },
          { stringNumber: 2, label: '2弦 D2', noteName: 'D2', midi: 38, description: '73.4 Hz' },
          { stringNumber: 1, label: '1弦 G2', noteName: 'G2', midi: 43, description: '98.0 Hz' },
        ],
      },
    ],
  },
  {
    id: 'violin-family',
    name: '提琴 Violin / Cello',
    category: 'bowed',
    categoryLabel: '西洋弓弦',
    iconName: 'Music',
    description: '支持小提琴、中提琴、大提琴纯五度标准定弦，可搭配五度相生律使用',
    tunings: [
      {
        id: 'violin-standard',
        name: '小提琴标准定弦 (G3 D4 A4 E5)',
        subtitle: '4弦 G3 → 3弦 D4 → 2弦 A4 → 1弦 E5',
        strings: [
          { stringNumber: 4, label: '4弦 G3', noteName: 'G3', midi: 55, description: 'G弦 (最粗)' },
          { stringNumber: 3, label: '3弦 D4', noteName: 'D4', midi: 62, description: 'D弦' },
          { stringNumber: 2, label: '2弦 A4', noteName: 'A4', midi: 69, description: 'A弦 (标准音)' },
          { stringNumber: 1, label: '1弦 E5', noteName: 'E5', midi: 76, description: 'E弦 (最细)' },
        ],
      },
      {
        id: 'viola-standard',
        name: '中提琴标准定弦 (C3 G3 D4 A4)',
        subtitle: '4弦 C3 → 3弦 G3 → 2弦 D4 → 1弦 A4',
        strings: [
          { stringNumber: 4, label: '4弦 C3', noteName: 'C3', midi: 48, description: 'C弦' },
          { stringNumber: 3, label: '3弦 G3', noteName: 'G3', midi: 55, description: 'G弦' },
          { stringNumber: 2, label: '2弦 D4', noteName: 'D4', midi: 62, description: 'D弦' },
          { stringNumber: 1, label: '1弦 A4', noteName: 'A4', midi: 69, description: 'A弦' },
        ],
      },
      {
        id: 'cello-standard',
        name: '大提琴标准定弦 (C2 G2 D3 A3)',
        subtitle: '4弦 C2 → 3弦 G2 → 2弦 D3 → 1弦 A3',
        strings: [
          { stringNumber: 4, label: '4弦 C2', noteName: 'C2', midi: 36, description: 'C弦 (65.4Hz)' },
          { stringNumber: 3, label: '3弦 G2', noteName: 'G2', midi: 43, description: 'G弦 (98.0Hz)' },
          { stringNumber: 2, label: '2弦 D3', noteName: 'D3', midi: 50, description: 'D弦 (146.8Hz)' },
          { stringNumber: 1, label: '1弦 A3', noteName: 'A3', midi: 57, description: 'A弦 (220.0Hz)' },
        ],
      },
    ],
  },
  {
    id: 'guzheng',
    name: '古筝 Guzheng',
    category: 'chinese',
    categoryLabel: '民族乐器',
    iconName: 'Sparkles',
    description: '21弦古筝标准五声音阶定弦（D调 / G调），标注绿弦（A弦）位置方便快速校音',
    tunings: [
      {
        id: 'guzheng-d-21',
        name: '古筝 D调 21弦完整定弦 (1=D)',
        subtitle: '21弦(倍低音1) D2 → 1弦(倍高音1) D6 · 含4根绿色A弦定位',
        strings: [
          { stringNumber: 21, label: '21弦 D2', noteName: 'D2', midi: 38, description: '倍低音 1 (最粗)' },
          { stringNumber: 20, label: '20弦 E2', noteName: 'E2', midi: 40, description: '倍低音 2' },
          { stringNumber: 19, label: '19弦 F#2', noteName: 'F#2', midi: 42, description: '倍低音 3' },
          { stringNumber: 18, label: '18弦 A2(绿)', noteName: 'A2', midi: 45, description: '倍低音 5 · 绿弦' },
          { stringNumber: 17, label: '17弦 B2', noteName: 'B2', midi: 47, description: '倍低音 6' },
          { stringNumber: 16, label: '16弦 D3', noteName: 'D3', midi: 50, description: '低音 1' },
          { stringNumber: 15, label: '15弦 E3', noteName: 'E3', midi: 52, description: '低音 2' },
          { stringNumber: 14, label: '14弦 F#3', noteName: 'F#3', midi: 54, description: '低音 3' },
          { stringNumber: 13, label: '13弦 A3(绿)', noteName: 'A3', midi: 57, description: '低音 5 · 绿弦' },
          { stringNumber: 12, label: '12弦 B3', noteName: 'B3', midi: 59, description: '低音 6' },
          { stringNumber: 11, label: '11弦 D4', noteName: 'D4', midi: 62, description: '中音 1' },
          { stringNumber: 10, label: '10弦 E4', noteName: 'E4', midi: 64, description: '中音 2' },
          { stringNumber: 9, label: '9弦 F#4', noteName: 'F#4', midi: 66, description: '中音 3' },
          { stringNumber: 8, label: '8弦 A4(绿)', noteName: 'A4', midi: 69, description: '中音 5 · 标准绿弦' },
          { stringNumber: 7, label: '7弦 B4', noteName: 'B4', midi: 71, description: '中音 6' },
          { stringNumber: 6, label: '6弦 D5', noteName: 'D5', midi: 74, description: '高音 1' },
          { stringNumber: 5, label: '5弦 E5', noteName: 'E5', midi: 76, description: '高音 2' },
          { stringNumber: 4, label: '4弦 F#5', noteName: 'F#5', midi: 78, description: '高音 3' },
          { stringNumber: 3, label: '3弦 A5(绿)', noteName: 'A5', midi: 81, description: '高音 5 · 绿弦' },
          { stringNumber: 2, label: '2弦 B5', noteName: 'B5', midi: 83, description: '高音 6' },
          { stringNumber: 1, label: '1弦 D6', noteName: 'D6', midi: 86, description: '倍高音 1 (最细)' },
        ],
      },
      {
        id: 'guzheng-g-core',
        name: '古筝 G调核心八度定弦 (1=G)',
        subtitle: '将D调中的 F# 弦调低半音至 G (即 C4→G3 宫商角徵羽)',
        strings: [
          { stringNumber: 16, label: '16弦 D3', noteName: 'D3', midi: 50, description: '低音 5' },
          { stringNumber: 15, label: '15弦 E3', noteName: 'E3', midi: 52, description: '低音 6' },
          { stringNumber: 14, label: '14弦 G3', noteName: 'G3', midi: 55, description: '中音 1' },
          { stringNumber: 13, label: '13弦 A3(绿)', noteName: 'A3', midi: 57, description: '中音 2' },
          { stringNumber: 12, label: '12弦 B3', noteName: 'B3', midi: 59, description: '中音 3' },
          { stringNumber: 11, label: '11弦 D4', noteName: 'D4', midi: 62, description: '中音 5' },
          { stringNumber: 10, label: '10弦 E4', noteName: 'E4', midi: 64, description: '中音 6' },
          { stringNumber: 9, label: '9弦 G4', noteName: 'G4', midi: 67, description: '高音 1' },
          { stringNumber: 8, label: '8弦 A4(绿)', noteName: 'A4', midi: 69, description: '高音 2 · 标准音' },
        ],
      },
    ],
  },
  {
    id: 'erhu-pipa',
    name: '二胡 / 琵琶 / 阮',
    category: 'chinese',
    categoryLabel: '民族乐器',
    iconName: 'Radio',
    description: '涵盖二胡标准里外弦（D4-A4）、琵琶四弦（A2-D3-E3-A3）及中阮/柳琴定弦',
    tunings: [
      {
        id: 'erhu-standard',
        name: '二胡标准定弦 (里弦 D4 · 外弦 A4)',
        subtitle: '适用于 D调(1 5弦)、G调(5 2弦)、F调(6 3弦)、C调(2 6弦)',
        strings: [
          { stringNumber: 2, label: '里弦 D4', noteName: 'D4', midi: 62, description: '内弦 (293.7 Hz)' },
          { stringNumber: 1, label: '外弦 A4', noteName: 'A4', midi: 69, description: '外弦 (440.0 Hz 标准音)' },
        ],
      },
      {
        id: 'pipa-standard',
        name: '琵琶标准定弦 (缠弦A2 · 老弦D3 · 中弦E3 · 子弦A3)',
        subtitle: '4弦 A2 → 3弦 D3 → 2弦 E3 → 1弦 A3',
        strings: [
          { stringNumber: 4, label: '4弦 缠弦 A2', noteName: 'A2', midi: 45, description: '110.0 Hz' },
          { stringNumber: 3, label: '3弦 老弦 D3', noteName: 'D3', midi: 50, description: '146.8 Hz' },
          { stringNumber: 2, label: '2弦 中弦 E3', noteName: 'E3', midi: 52, description: '164.8 Hz' },
          { stringNumber: 1, label: '1弦 子弦 A3', noteName: 'A3', midi: 57, description: '220.0 Hz' },
        ],
      },
      {
        id: 'zhongruan-standard',
        name: '中阮标准定弦 (G2 D3 G3 D4)',
        subtitle: '4弦 G2 → 3弦 D3 → 2弦 G3 → 1弦 D4',
        strings: [
          { stringNumber: 4, label: '4弦 G2', noteName: 'G2', midi: 43, description: '98.0 Hz' },
          { stringNumber: 3, label: '3弦 D3', noteName: 'D3', midi: 50, description: '146.8 Hz' },
          { stringNumber: 2, label: '2弦 G3', noteName: 'G3', midi: 55, description: '196.0 Hz' },
          { stringNumber: 1, label: '1弦 D4', noteName: 'D4', midi: 62, description: '293.7 Hz' },
        ],
      },
      {
        id: 'liuqin-standard',
        name: '柳琴标准定弦 (G3 D4 G4 D5)',
        subtitle: '4弦 G3 → 3弦 D4 → 2弦 G4 → 1弦 D5',
        strings: [
          { stringNumber: 4, label: '4弦 G3', noteName: 'G3', midi: 55, description: '196.0 Hz' },
          { stringNumber: 3, label: '3弦 D4', noteName: 'D4', midi: 62, description: '293.7 Hz' },
          { stringNumber: 2, label: '2弦 G4', noteName: 'G4', midi: 67, description: '392.0 Hz' },
          { stringNumber: 1, label: '1弦 D5', noteName: 'D5', midi: 74, description: '587.3 Hz' },
        ],
      },
    ],
  },
];
