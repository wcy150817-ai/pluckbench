import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

const SITE_ORIGIN = 'https://www.pluckbench.com';
const TODAY = '2026-10-26';

/**
 * 9 SEO Pages following GeFei SEO SOP:
 * - 1 Core Keyword per Page ("一个关键词一个页面")
 * - Title: 50-60 characters, [Core Keyword] - [Value Prop] | PluckBench
 * - Description: 150-160 characters, [Problem] + [Solution] + [CTA]
 * - Strictly 1 <h1>, structured <h2> & <h3> hierarchy
 * - 650-850 words per page, ~3.0%-3.5% core keyword density
 * - Static HTML injected directly into <div id="root">...</div> so view-source: shows full content
 */
const SEO_PAGES = [
  {
    slug: '',
    canonicalPath: '/',
    priority: '1.0',
    keyword: 'online instrument tuner',
    title: 'Online Instrument Tuner, Metronome & Chords | PluckBench', // 56 chars
    description:
      'Need an accurate online instrument tuner? Tune guitar, ukulele, violin, and guzheng via microphone with sustain pitch lock and noise filter. Tune free now!', // 155 chars
    h1: 'Online Instrument Tuner, Metronome & Chord Workbench — PluckBench Pro',
    instrumentName: 'Chromatic & Multi-Instrument',
    tuningSummary: 'Guitar (E2-E4), Ukulele (G4-A4), Violin (G3-E5), Guzheng (D2-D6), Bass (E1-G2)',
    freqRange: '27.5 Hz (A0) – 4186.0 Hz (C8)',
    timbreDesc: 'Karplus-Strong physical modeling plucked string and bowed resonator synthesis',
    tuningRows: [
      ['Acoustic / Electric Guitar (6-String)', 'E2 – A2 – D3 – G3 – B3 – E4', '82.41 Hz – 329.63 Hz', '±1.5 cents Sustain Lock'],
      ['Soprano / Concert / Tenor Ukulele', 'G4 – C4 – E4 – A4', '392.00 Hz – 440.00 Hz', '±1.5 cents Re-entrant'],
      ['Violin / Viola / Cello (Bowed)', 'G3 – D4 – A4 – E5', '196.00 Hz – 659.25 Hz', '440 / 442 Hz Orchestral'],
      ['Guzheng (21-String D Major Pentatonic)', 'D2 – E2 – F#2 – A2 – B2 ... D6', '73.42 Hz – 1174.66 Hz', 'Equal & Just Intonation'],
      ['4-String & 5-String Bass Guitar', 'B0 – E1 – A1 – D2 – G2', '30.87 Hz – 98.00 Hz', 'Sub-Bass Harmonic Lock'],
    ],
    faq: [
      {
        q: 'Why does a plucked string read sharp right after plucking on an online instrument tuner?',
        a: 'When you pluck a string on a guitar, ukulele, or guzheng, finger displacement momentarily increases tension, producing a 15 to 40 cent sharp transient during the first 100 milliseconds. Our 3-stage sustain-phase pitch tracker skips the initial attack peak and locks onto the true harmonic fundamental.',
      },
      {
        q: 'How can I tune my instrument accurately in a noisy rehearsal room or classroom?',
        a: 'Enable the Noise Shield button in the top bar and select Manual String Lock. This online instrument tuner applies a narrow high-Q bandpass filter around your target string frequency and rejects ambient speech, air conditioning hum, and room echo.',
      },
      {
        q: 'Does PluckBench require installing a mobile app or browser extension?',
        a: 'No installation is required. PluckBench runs directly in Chrome, Safari, Edge, and mobile browsers using the Web Audio API with sub-millisecond pitch analysis and authentic physical modeling reference tones.',
      },
    ],
  },
  {
    slug: 'guitar-tuner',
    canonicalPath: '/guitar-tuner',
    priority: '0.9',
    keyword: 'online guitar tuner',
    title: 'Online Guitar Tuner - Standard, Drop D & Half-Step | PluckBench', // 63 -> let's make 56 chars
    description:
      'Looking for a fast online guitar tuner? Tune acoustic and electric guitars in Standard, Drop D, or Eb via microphone with sustain lock. Start tuning free!', // 154 chars
    h1: 'Online Guitar Tuner — Standard E, Drop D & Open Tunings via Microphone',
    instrumentName: 'Acoustic & Electric Guitar',
    tuningSummary: 'Standard (E2 A2 D3 G3 B3 E4), Drop D (D2 A2 D3 G3 B3 E4), Half-Step Down (Eb2-Eb4), Open G & DADGAD',
    freqRange: '73.42 Hz (D2) – 329.63 Hz (E4)',
    timbreDesc: 'Karplus-Strong acoustic steel-string and warm electric guitar reference tones',
    tuningRows: [
      ['6th String (Low E)', 'E2 (Standard) / D2 (Drop D)', '82.41 Hz / 73.42 Hz', 'Wound Bronze / Nickel'],
      ['5th String (A)', 'A2', '110.00 Hz', 'Wound Fundamental Lock'],
      ['4th String (D)', 'D3', '146.83 Hz', 'Sustain Window 95ms'],
      ['3rd String (G)', 'G3', '196.00 Hz', 'Intonation Compensated'],
      ['2nd String (B)', 'B3', '246.94 Hz', 'Plain Steel Precision'],
      ['1st String (High E)', 'E4', '329.63 Hz', '±1.0 Cent Lock Chime'],
    ],
    faq: [
      {
        q: 'How do I tune a 6-string guitar using this online guitar tuner?',
        a: 'Click the string you want to tune on the first-screen selector (from 6th string E2 to 1st string E4), grant microphone access, and pluck a single string cleanly. The sustain-phase detector locks onto the steady tone and plays a confirmation chime when the needle settles within ±2 cents.',
      },
      {
        q: 'Can I calibrate Drop D, Half-Step Down, and DADGAD alternate tunings?',
        a: 'Yes. Switch the tuning preset selector from Standard E to Drop D, Half-Step Down (Eb), Open G, or DADGAD, and the online guitar tuner automatically recalibrates all six target string frequencies and bandpass filters.',
      },
      {
        q: 'Why does the G3 string on acoustic guitars often sound slightly off?',
        a: 'Unwound G3 strings have high stiffness relative to their diameter, causing pronounced attack pitch chirp. PluckBench ignores the first 90ms attack peak so you tune the sustained pitch that listeners actually hear in chords.',
      },
    ],
  },
  {
    slug: 'ukulele-tuner',
    canonicalPath: '/ukulele-tuner',
    priority: '0.9',
    keyword: 'online ukulele tuner',
    title: 'Online Ukulele Tuner - GCEA Soprano & Baritone | PluckBench', // 59 chars
    description:
      'Need a reliable online ukulele tuner? Tune Soprano, Concert, Tenor (G4-C4-E4-A4), Low G, and Baritone ukuleles with nylon reference tones. Tune free today!', // 155 chars
    h1: 'Online Ukulele Tuner — Standard GCEA, Low G & Baritone Ukulele Tuning',
    instrumentName: 'Soprano, Concert, Tenor & Baritone Ukulele',
    tuningSummary: 'Standard Re-entrant G4-C4-E4-A4, Low G (G3-C4-E4-A4), Baritone (D3-G3-B3-E4)',
    freqRange: '146.83 Hz (D3) – 440.00 Hz (A4)',
    timbreDesc: 'Warm nylon-string physical modeling ukulele pluck synthesis',
    tuningRows: [
      ['4th String (Top G)', 'G4 (Re-entrant) / G3 (Low G)', '392.00 Hz / 196.00 Hz', 'Nylon / Fluorocarbon'],
      ['3rd String (Lowest Pitch C)', 'C4 (Middle C)', '261.63 Hz', 'Core Resonance String'],
      ['2nd String (E)', 'E4', '329.63 Hz', 'Sweet Major Third'],
      ['1st String (Bottom A)', 'A4 (Concert Pitch)', '440.00 Hz', '±1.5 Cent Sustain Lock'],
    ],
    faq: [
      {
        q: 'Why is the 4th string (G4) higher in pitch than the 3rd string (C4) on an online ukulele tuner?',
        a: 'Standard soprano, concert, and tenor ukuleles use re-entrant GCEA tuning where the 4th string is tuned to G4 (392.00 Hz), just below the 1st string A4 (440.00 Hz). Clear scientific pitch octave labels ensure you never accidentally over-tighten a string.',
      },
      {
        q: 'Why do new nylon ukulele strings keep going flat after tuning?',
        a: 'Fresh nylon and fluorocarbon ukulele strings stretch for several days. Tune each string up to pitch, gently stretch the string over the soundhole, and re-check with the online ukulele tuner until the sustain lock chime holds steady.',
      },
      {
        q: 'Are Low G and Baritone ukulele presets supported?',
        a: 'Yes. Select Low G (G3-C4-E4-A4) or Baritone (D3-G3-B3-E4) in the preset bar to update both the nylon reference pluck sound and the microphone target frequencies.',
      },
    ],
  },
  {
    slug: 'violin-tuner',
    canonicalPath: '/violin-tuner',
    priority: '0.85',
    keyword: 'online violin tuner',
    title: 'Online Violin Tuner - G3 D4 A4 E5 & 442Hz Pitch | PluckBench', // 60 chars
    description:
      'Searching for a precise online violin tuner? Tune G3, D4, A4, and E5 strings with bowed reference tones, 440Hz/442Hz A4 calibration, and just intonation.', // 153 chars
    h1: 'Online Violin Tuner — Precision G3 D4 A4 E5 Bowed Reference & 442Hz Calibration',
    instrumentName: 'Violin, Viola & Cello',
    tuningSummary: 'Violin Standard (G3-D4-A4-E5), Viola (C3-G3-D4-A4), Cello (C2-G2-D3-A3)',
    freqRange: '196.00 Hz (G3) – 659.25 Hz (E5)',
    timbreDesc: 'Continuous bowed sawtooth-harmonic resonator with warm wooden body formants',
    tuningRows: [
      ['4th String (Lowest G)', 'G3', '196.00 Hz (at A4=440Hz)', 'Silver / Synthetic Core'],
      ['3rd String (D)', 'D4', '293.66 Hz (at A4=440Hz)', 'Warm Middle Register'],
      ['2nd String (A — Orchestral Ref)', 'A4', '440.00 Hz / 442.00 Hz', 'Primary Tuning Reference'],
      ['1st String (Highest E)', 'E5', '659.25 Hz (at A4=440Hz)', 'Fine-Tuner Precision'],
    ],
    faq: [
      {
        q: 'Should I tune my violin to 440 Hz or 442 Hz on this online violin tuner?',
        a: 'Solo and chamber players often use 440 Hz, while many modern symphony orchestras tune A4 to 442 Hz for brighter projection. You can adjust A4 calibration in 1 Hz steps from 430 Hz to 450 Hz in the calibration toolbar.',
      },
      {
        q: 'Should I pluck (pizzicato) or bow when calibrating violin strings?',
        a: 'For initial peg adjustments, plucking works well; for final fine-tuner calibration, bow smoothly in the middle of the bow. This online violin tuner locks onto continuous bowed sustain with ±0.5 cent visual resolution.',
      },
      {
        q: 'Are pure fifths and Pythagorean temperament supported for bowed strings?',
        a: 'Yes. Switch the temperament selector between 12-TET Equal Temperament, Just Intonation, and Pythagorean tuning to match solo or string quartet intonation requirements.',
      },
    ],
  },
  {
    slug: 'guzheng-tuner',
    canonicalPath: '/guzheng-tuner',
    priority: '0.85',
    keyword: 'online guzheng tuner',
    title: 'Online Guzheng Tuner - 21-String D, G & C Major | PluckBench', // 60 chars
    description:
      'Need an authentic online guzheng tuner? Tune all 21 strings in D Major, G Major, or C Major pentatonic scales with sustain pitch lock and guzheng tones.', // 153 chars
    h1: 'Online Guzheng Tuner — 21-String D Major, G Major & Pentatonic Bridge Calibration',
    instrumentName: '21-String Chinese Guzheng (古筝)',
    tuningSummary: 'D Major Pentatonic (1=D: D2 E2 F#2 A2 B2 ... D6), G Major (1=G), C Major (1=C)',
    freqRange: '73.42 Hz (String 21 D2) – 1174.66 Hz (String 1 D6)',
    timbreDesc: 'Authentic Guzheng plucked resonance with silk-steel harmonic overtones',
    tuningRows: [
      ['Strings 21–17 (Bass Octave)', 'D2 – E2 – F#2 – A2 (Green) – B2', '73.42 Hz – 123.47 Hz', 'Wound Copper-Steel Bass'],
      ['Strings 16–12 (Tenor Octave)', 'D3 – E3 – F#3 – A3 (Green) – B3', '146.83 Hz – 246.94 Hz', 'Warm Resonant Register'],
      ['Strings 11–7 (Middle Octave)', 'D4 – E4 – F#4 – A4 (Green) – B4', '293.66 Hz – 493.88 Hz', 'A4=440Hz Green String 8'],
      ['Strings 6–1 (Treble Octave)', 'D5 – E5 – F#5 – A5 (Green) – B5 – D6', '587.33 Hz – 1174.66 Hz', 'Sustain Chirp Filtered'],
    ],
    faq: [
      {
        q: 'Why do Guzheng strings show a huge pitch jump right when plucked with picks?',
        a: 'Guzheng strings span over 160 cm across movable bridges (YanZhu), so tortoise-shell or nylon picks create a strong initial tension spike. Our online guzheng tuner filters out the first 110ms attack chirp and measures the true sustained resonance.',
      },
      {
        q: 'Which strings are the green marker strings on a 21-string Guzheng?',
        a: 'In standard D Major (1=D) tuning, the green strings (Strings 4, 9, 14, and 19) correspond to Sol (A5, A4, A3, A2). You can also switch display notation to Numbered Musical Notation (Jianpu 1-2-3-5-6) inside the online guzheng tuner.',
      },
      {
        q: 'How do I modulate from D Major to G Major on a Guzheng?',
        a: 'Select Guzheng in the preset bar and switch the tuning variant to G Major (raising F# strings to G by moving the #3, #8, #13, and #18 bridges slightly to the right).',
      },
    ],
  },
  {
    slug: 'bass-tuner',
    canonicalPath: '/bass-tuner',
    priority: '0.85',
    keyword: 'online bass tuner',
    title: 'Online Bass Tuner - 4-String & 5-String Sub-Bass | PluckBench', // 61 -> let's make 58 chars: 'Online Bass Tuner - 4 & 5 String Sub-Bass Lock | PluckBench' (59 chars)
    description:
      'Looking for an accurate online bass tuner? Track low E1 (41.2Hz) and B0 (30.87Hz) fundamentals cleanly using sub-bass autocorrelation and sustain lock.', // 152 chars
    h1: 'Online Bass Tuner — Precision 4-String (E1-G2) & 5-String (B0-G2) Sub-Bass Pitch Lock',
    instrumentName: '4-String & 5-String Electric / Acoustic Bass',
    tuningSummary: '4-String Standard (E1-A1-D2-G2), 5-String Low B (B0-E1-A1-D2-G2), Drop D Bass (D1-A1-D2-G2)',
    freqRange: '30.87 Hz (B0) – 98.00 Hz (G2)',
    timbreDesc: 'Deep sub-bass fundamental synthesis with clean 2nd and 3rd harmonic overtones',
    tuningRows: [
      ['5th String (Low B — 5-String Bass)', 'B0', '30.87 Hz', 'Long-Window Sub-Bass DSP'],
      ['4th String (Low E)', 'E1 (Standard) / D1 (Drop D)', '41.20 Hz / 36.71 Hz', 'Harmonic Fundamental Lock'],
      ['3rd String (A)', 'A1', '55.00 Hz', 'Low-Pass Noise Filtered'],
      ['2nd String (D)', 'D2', '73.42 Hz', 'Sustain Window 110ms'],
      ['1st String (G)', 'G2', '98.00 Hz', '±1.5 Cent Lock Chime'],
    ],
    faq: [
      {
        q: 'Why do many phone and web tuners fail to detect the low E1 or B0 bass string?',
        a: 'Small laptop and phone microphones roll off below 60 Hz, making the 2nd harmonic (82.4 Hz or 61.7 Hz) louder than the fundamental. Our online bass tuner uses an 8192-sample McLeod Pitch Method window that reconstructs the true sub-bass fundamental from its harmonic series.',
      },
      {
        q: 'Should I use neck pickup or bridge pickup when tuning electric bass?',
        a: 'For electric bass, select the neck pickup and roll the tone knob slightly down. This feeds a cleaner fundamental waveform into the online bass tuner for faster sustain lock.',
      },
      {
        q: 'Can I play reference bass notes that are audible on phone speakers?',
        a: 'Yes. The reference generator blends the sub-bass fundamental with balanced upper harmonics so your ear can clearly match pitch even on compact mobile speakers.',
      },
    ],
  },
  {
    slug: 'online-metronome',
    canonicalPath: '/online-metronome',
    priority: '0.85',
    keyword: 'online metronome',
    title: 'Online Metronome - Tap BPM, Subdivisions & Beats | PluckBench', // 61 -> let's make 58 chars: 'Online Metronome - Tap BPM & Visual Beat Pulse | PluckBench' (59 chars)
    description:
      'Practice rhythm with our free online metronome featuring Web Audio hardware-clock timing, Tap BPM tempo detection, downbeat accents, and visual beat LEDs.', // 154 chars
    h1: 'Online Metronome — Zero-Drift Web Audio Tempo Clock, Tap BPM & Time Signatures',
    instrumentName: 'Rhythm & Tempo Practice Workbench',
    tuningSummary: '30 – 260 BPM, 2/4, 3/4, 4/4, 6/8, 5/4 Time Signatures, Tap Tempo & Woodblock/Click Timbres',
    freqRange: '30 BPM (Largo) – 260 BPM (Prestissimo)',
    timbreDesc: 'Sample-accurate Web Audio oscillator & woodblock impulse scheduling',
    tuningRows: [
      ['40 – 66 BPM', 'Largo / Lento / Adagio', 'Slow Expressive Ballads & Bow Control', 'Subdivision Recommended'],
      ['66 – 108 BPM', 'Andante / Moderato', 'Folk Strumming, Pop Grooves & Etudes', '4/4 & 3/4 Standard'],
      ['108 – 156 BPM', 'Allegro / Vivace', 'Rock, Upbeat Acoustic & Classical Solos', 'Downbeat Accent Active'],
      ['156 – 240+ BPM', 'Presto / Prestissimo', 'Fast Alternate Picking & Bebop Runs', 'Zero-Jitter Audio Clock'],
    ],
    faq: [
      {
        q: 'Why is a Web Audio online metronome more accurate than standard browser timers?',
        a: 'Ordinary JavaScript setInterval timers drift by 15–50ms whenever the browser redraws the screen. Our online metronome schedules every click directly on the hardware AudioContext clock for sub-millisecond studio precision.',
      },
      {
        q: 'How does the Tap BPM tempo detector work?',
        a: 'Tap the Tap BPM button four or more times in rhythm with any song you are learning, and the online metronome automatically calculates the average interval and sets the exact BPM.',
      },
      {
        q: 'Can I switch between rhythm practice and the instrument tuner without losing settings?',
        a: 'Yes. PluckBench integrates the online metronome, chromatic tuner, and chord library in one unified workbench so your calibration and preset choices stay active.',
      },
    ],
  },
  {
    slug: 'guitar-chords',
    canonicalPath: '/guitar-chords',
    priority: '0.85',
    keyword: 'guitar chord library',
    title: 'Guitar Chord Library - Fingerings & Audio Strum | PluckBench', // 60 chars
    description:
      'Explore our interactive guitar chord library with SVG fretboard diagrams, finger numbers, and realistic acoustic strum playback for guitar and ukulele.', // 151 chars
    h1: 'Guitar Chord Library — Interactive Fretboard Diagrams, Fingerings & Acoustic Strum Preview',
    instrumentName: 'Guitar & Ukulele Chord Fingering Reference',
    tuningSummary: 'Major, Minor, 7th, Maj7, m7, Sus4 & Add9 Chords across C, D, E, F, G, A, B Roots',
    freqRange: 'Interactive 6-String Guitar & 4-String Ukulele Voicings',
    timbreDesc: 'Staggered 35ms arpeggiated Karplus-Strong acoustic chord strum engine',
    tuningRows: [
      ['Open Major Chords (C, A, G, E, D)', '1 – 3 – 5 Triad Voicings', 'Open Strings + Frets 1–3', 'Essential Beginner Shapes'],
      ['Open Minor Chords (Am, Dm, Em)', '1 – b3 – 5 Minor Triads', 'Open Position Fretboard', 'Expressive Songwriting'],
      ['Barre Chords (F, Bm, F#m)', 'Index Finger Full Barre', 'Movable E-Shape & A-Shape', 'Full Neck Versatility'],
      ['7th & Color Chords (G7, Cmaj7, Asus4)', '4-Note Extended Harmony', 'Jazz, Folk & Pop Voicings', 'Interactive Audio Strum'],
    ],
    faq: [
      {
        q: 'How do I read the fretboard diagrams in this guitar chord library?',
        a: 'Vertical lines represent strings from 6th (low E on the left) to 1st (high E on the right), and horizontal lines represent frets. Numbered dots show which finger (1=Index, 2=Middle, 3=Ring, 4=Pinky) presses each fret, while O means play open and X means mute.',
      },
      {
        q: 'Can I hear how each chord voicing sounds before playing it?',
        a: 'Yes. Click the Strum button on any card in the guitar chord library to hear a realistic staggered acoustic guitar or ukulele strum synthesized in real time.',
      },
      {
        q: 'Are 4-string ukulele chord diagrams also included?',
        a: 'Yes. Toggle between 6-string Guitar and 4-string Ukulele views to inspect GCEA ukulele fingerings with instant audio playback.',
      },
    ],
  },
  {
    slug: 'decibel-meter',
    canonicalPath: '/decibel-meter',
    priority: '0.8',
    keyword: 'online decibel meter',
    title: 'Online Decibel Meter - Real-Time Room dB & Noise | PluckBench', // 61 -> let's make 58 chars: 'Online Decibel Meter - Real-Time Room Sound dB | PluckBench' (59 chars)
    description:
      'Measure room noise and practice volume with our free online decibel meter. Track real-time dB SPL, peak hold, and acoustic noise thresholds via microphone.', // 155 chars
    h1: 'Online Decibel Meter — Real-Time Acoustic dB SPL Monitor & Practice Room Noise Analyzer',
    instrumentName: 'Real-Time Acoustic Sound Level & Noise Floor Meter',
    tuningSummary: '20 dB (Silent Studio) – 110 dB (Loud Stage), Peak Hold, Average dB & Hearing Safety Zones',
    freqRange: '20 Hz – 20,000 Hz Full-Band RMS & Peak Acoustic Tracking',
    timbreDesc: 'Real-time microphone RMS-to-dB SPL conversion with visual spectrum level bar',
    tuningRows: [
      ['20 – 38 dB SPL', 'Recording Studio / Quiet Bedroom', 'Ideal for Unplugged Acoustic Tuning', 'Noise Shield Optional'],
      ['40 – 58 dB SPL', 'Normal Conversation / Living Room', 'Standard Home Practice Environment', 'Recommended Gate -45dB'],
      ['60 – 78 dB SPL', 'Busy Classroom / Group Rehearsal', 'High Ambient Interference', 'Enable Noise Shield + Manual Lock'],
      ['80 – 105+ dB SPL', 'Amplified Band / Loud Stage', 'Hearing Caution Over Long Sessions', 'Close-Mic Placement Needed'],
    ],
    faq: [
      {
        q: 'How does this online decibel meter help improve instrument tuning accuracy?',
        a: 'When ambient noise exceeds 55 dB SPL, background chatter and fan hum can distract standard tuners. Checking your room noise floor on our online decibel meter tells you when to activate PluckBench Noise Shield and Manual String Lock.',
      },
      {
        q: 'Is an acoustic sound level monitor useful for daily instrument practice?',
        a: 'Yes. Monitor average and peak dB levels during acoustic guitar, violin, brass, or drum practice to keep daily rehearsal volume within comfortable hearing thresholds.',
      },
      {
        q: 'Does PluckBench record or upload my microphone audio stream?',
        a: 'Never. All audio level calculations happen 100% locally inside your browser memory using the Web Audio API; zero audio data ever leaves your device.',
      },
    ],
  },
];

// Adjust titles to guarantee strictly 50 <= length <= 60
SEO_PAGES[1].title = 'Online Guitar Tuner - Standard & Drop D Tuning | PluckBench'; // 59 chars
SEO_PAGES[5].title = 'Online Bass Tuner - 4 & 5 String Sub-Bass Lock | PluckBench'; // 59 chars
SEO_PAGES[6].title = 'Online Metronome - Tap BPM & Visual Beat Pulse | PluckBench'; // 59 chars
SEO_PAGES[8].title = 'Online Decibel Meter - Real-Time Room Sound dB | PluckBench'; // 59 chars

function countWords(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\w\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function countKeywordOccurrences(text, keyword) {
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  const target = keyword.toLowerCase();
  let pos = 0;
  let count = 0;
  while (true) {
    const idx = plain.indexOf(target, pos);
    if (idx === -1) break;
    count++;
    pos = idx + target.length;
  }
  return count;
}

function buildPreRenderedBodyHtml(page) {
  const kw = page.keyword;
  const kwCap = kw.replace(/\b\w/g, (c) => c.toUpperCase());

  const navLinksHtml = SEO_PAGES.map(
    (p) =>
      `<a href="${p.canonicalPath}" class="px-2.5 py-1.5 rounded-lg border border-slate-700/70 text-xs text-slate-300 hover:text-emerald-400">${p.title.split(' - ')[0].split(' | ')[0]}</a>`
  ).join('\n            ');

  const tableRowsHtml = page.tuningRows
    .map(
      (r) => `
              <tr class="border-b border-slate-800/70">
                <td class="py-2 pr-3 font-semibold">${r[0]}</td>
                <td class="py-2 pr-3 font-mono text-emerald-400">${r[1]}</td>
                <td class="py-2 pr-3 font-mono">${r[2]}</td>
                <td class="py-2">${r[3]}</td>
              </tr>`
    )
    .join('');

  const faqHtml = page.faq
    .map(
      (item) => `
          <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
            <h3 class="text-sm font-bold text-slate-100">${item.q}</h3>
            <p class="text-xs leading-relaxed text-slate-300">${item.a}</p>
          </div>`
    )
    .join('\n');

  return `
      <div class="min-h-screen bg-[#070a0f] text-slate-100 font-sans">
        <header class="border-b border-slate-800/80 px-4 py-3 bg-slate-950/90">
          <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-base sm:text-lg font-extrabold tracking-tight text-slate-100">
              ${page.h1}
            </h1>
            <div class="text-xs text-emerald-400 font-mono">
              A4 = 440 Hz · Sustain Pitch Lock · Noise Shield DSP
            </div>
          </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-6 space-y-8">
          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 class="text-lg font-bold text-slate-100">
              Studio-Grade ${kwCap} for ${page.instrumentName}
            </h2>
            <p class="text-sm leading-relaxed text-slate-300">
              Welcome to PluckBench Pro, a studio-grade <strong>${kw}</strong> engineered for musicians, music educators, and luthiers who demand reliable pitch calibration directly in the browser. Unlike basic microphone tools that jitter wildly during string pluck attacks, our 4096-sample McLeod Pitch Method (MPM) autocorrelation engine is paired with a 3-stage sustain-phase envelope detector. Whether you are calibrating ${page.instrumentName} at home, backstage, or in a busy classroom, PluckBench isolates the true sustained fundamental frequency across ${page.freqRange} with sub-cent visual stability.
            </p>
            <p class="text-sm leading-relaxed text-slate-300">
              Every acoustic player knows that real strings behave dynamically: the initial pick or finger displacement creates a sharp pitch transient before settling into a stable harmonic sustain. By using a string-first workflow inside this <strong>${kw}</strong>, you can lock onto any target string on the first screen, trigger reference notes powered by ${page.timbreDesc}, and wait for the 400ms sustain lock confirmation chime.
            </p>
            <p class="text-sm leading-relaxed text-slate-300">
              For cross-platform convenience, all digital signal processing runs natively via the Web Audio API on desktop laptops, iPad tablets, and iOS or Android phones without installing plugins or uploading microphone audio to external servers. You can also customize concert pitch calibration from A4 = 430 Hz to 450 Hz and switch between 12-Tone Equal Temperament, Just Intonation, and Pythagorean tuning.
            </p>
          </section>

          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 class="text-lg font-bold text-slate-100">
              Standard Frequencies &amp; Calibration Reference Table
            </h2>
            <p class="text-xs leading-relaxed text-slate-300">
              Use the reference chart below alongside the interactive dial meter to verify target note names, scientific pitch octaves, and exact Hertz values (${page.tuningSummary}):
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-700 text-slate-400">
                    <th class="py-2 pr-3 font-semibold">String / Range</th>
                    <th class="py-2 pr-3 font-semibold">Target Note &amp; Octave</th>
                    <th class="py-2 pr-3 font-semibold">Reference Frequency (Hz)</th>
                    <th class="py-2 font-semibold">Calibration Mode</th>
                  </tr>
                </thead>
                <tbody>${tableRowsHtml}
                </tbody>
              </table>
            </div>
          </section>

          <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 class="text-sm font-bold text-slate-100">
                1. Sustain-Phase Pitch Lock Technology
              </h3>
              <p class="text-xs leading-relaxed text-slate-300">
                Plucked and bowed strings exhibit a natural pitch envelope. During the first 80 to 120 milliseconds after plucking, string tension spikes and causes a temporary sharp reading. Our sustain-phase tracker automatically filters out the transient attack peak and locks onto the steady decay window so your chord intonation stays true across the entire fretboard.
              </p>
            </div>
            <div class="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 class="text-sm font-bold text-slate-100">
                2. Hardware-Grade Bandpass Noise Shield
              </h3>
              <p class="text-xs leading-relaxed text-slate-300">
                Practicing in a shared rehearsal room or near air conditioning can confuse ordinary microphone detectors. When you select a target string and activate Noise Shield in this <strong>${kw}</strong>, a narrow high-Q Biquad bandpass filter focuses exclusively on the selected string frequency and rejects non-harmonic room noise.
              </p>
            </div>
            <div class="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 class="text-sm font-bold text-slate-100">
                3. Physical Modeling Reference Timbres
              </h3>
              <p class="text-xs leading-relaxed text-slate-300">
                Training your ear while calibrating strings is much easier when the reference note sounds like your real instrument instead of a harsh electronic beep. Click any string button to hear ${page.timbreDesc} calibrated to your chosen A4 reference pitch (430 Hz – 450 Hz) and musical temperament.
              </p>
            </div>
          </section>

          <section class="space-y-3">
            <h2 class="text-lg font-bold text-slate-100">
              Frequently Asked Questions &amp; Acoustic Calibration Guide
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${faqHtml}
            </div>
          </section>

          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
            <h2 class="text-base font-bold text-slate-100">
              Explore All Dedicated Online Instrument Tuners &amp; Music Practice Tools
            </h2>
            <p class="text-xs text-slate-400">
              Switch directly to any specialized preset in the PluckBench suite below:
            </p>
            <nav aria-label="PluckBench Music Tools Navigation" class="flex flex-wrap gap-2">
              ${navLinksHtml}
            </nav>
          </section>
        </main>
      </div>`;
}

function buildJsonLd(page) {
  const fullUrl = `${SITE_ORIGIN}${page.canonicalPath}`;
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: page.title,
          url: fullUrl,
          description: page.description,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Web, iOS, Android, macOS, Windows',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList: [
            'Three-Stage Sustain Pitch Lock Chromatic & Instrument Tuner',
            'Hardware-Style Bandpass Noise Reduction & Smart Noisy Room Alert',
            'Karplus-Strong Physical Modeling Guitar, Ukulele, Guzheng, Erhu & Violin Reference Tones',
            'Precision Visual Metronome with Tap BPM',
            'Interactive Guitar & Ukulele Chord Fingering Library',
            'Pitch Ear Trainer & Acoustic Decibel Meter',
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: page.faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        },
      ],
    },
    null,
    2
  );
}

function injectPageSeo(templateHtml, page) {
  const fullUrl = `${SITE_ORIGIN}${page.canonicalPath}`;
  const bodyHtml = buildPreRenderedBodyHtml(page);
  const jsonLd = buildJsonLd(page);

  let html = templateHtml;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${page.description}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${fullUrl}" />`
  );

  // Replace OpenGraph title, description, url
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${fullUrl}" />`
  );

  // Replace JSON-LD script
  html = html.replace(
    /<script id="seo-json-ld" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="seo-json-ld" type="application/ld+json">\n${jsonLd}\n    </script>`
  );

  // Inject pre-rendered semantic HTML inside <div id="root">...</div>
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}\n    </div>`);

  return { html, bodyHtml };
}

function generateSitemapXml() {
  const urls = SEO_PAGES.map(
    (page) => `  <url>
    <loc>${SITE_ORIGIN}${page.canonicalPath}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function main() {
  const distIndexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    throw new Error(`dist/index.html not found at ${distIndexPath}. Run vite build first.`);
  }

  const baseTemplate = fs.readFileSync(distIndexPath, 'utf8');

  console.log('\n================================================================================');
  console.log('PluckBench GeFei SEO Static Pre-Renderer & Keyword Density Audit');
  console.log('================================================================================');

  for (const page of SEO_PAGES) {
    const { html, bodyHtml } = injectPageSeo(baseTemplate, page);
    const titleLen = page.title.length;
    const descLen = page.description.length;
    const totalWords = countWords(bodyHtml);
    const kwOccurrences = countKeywordOccurrences(bodyHtml, page.keyword);
    const kwWordLen = page.keyword.split(/\s+/).length;
    const densityPct = ((kwOccurrences * kwWordLen) / totalWords) * 100;

    // Validate GeFei TDH & content rules
    if (titleLen < 50 || titleLen > 60) {
      throw new Error(`[SEO Audit Failed] ${page.canonicalPath} Title length ${titleLen} out of 50-60 range: "${page.title}"`);
    }
    if (descLen < 150 || descLen > 160) {
      throw new Error(`[SEO Audit Failed] ${page.canonicalPath} Description length ${descLen} out of 150-160 range: "${page.description}"`);
    }
    if (totalWords < 600) {
      throw new Error(`[SEO Audit Failed] ${page.canonicalPath} Word count ${totalWords} < 600 words minimum`);
    }

    const outDir = page.slug ? path.join(distDir, page.slug) : distDir;
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    console.log(
      `✓ ${page.canonicalPath.padEnd(18)} | Keyword: "${page.keyword}" | Title: ${titleLen}c | Desc: ${descLen}c | Words: ${totalWords} | Density: ${densityPct.toFixed(2)}% (${kwOccurrences}x)`
    );
  }

  const sitemapXml = generateSitemapXml();
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log('--------------------------------------------------------------------------------');
  console.log(`✓ Generated sitemap.xml with ${SEO_PAGES.length} canonical URLs.`);
  console.log('================================================================================\n');
}

main();
