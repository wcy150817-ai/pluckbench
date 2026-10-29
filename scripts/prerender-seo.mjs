import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

const SITE_ORIGIN = 'https://www.pluckbench.com';
const TODAY = '2026-10-29';

/**
 * 4 Live Interactive Calculator / Reference Guide Pages (Days 1–4)
 * Placed in public/<slug>/index.html and copied to dist/<slug>/index.html by Vite.
 */
const LIVE_CALCULATOR_PAGES = [
  {
    canonicalPath: '/drop-d-alternate-guitar-tuning-chart',
    priority: '0.85',
    shortLabel: 'Drop D & Alternate Tuning Calculator',
  },
  {
    canonicalPath: '/bpm-to-ms-delay-time-calculator',
    priority: '0.85',
    shortLabel: 'BPM to ms Delay & Pre-Delay Calculator',
  },
  {
    canonicalPath: '/capo-transposition-chord-chart-calculator',
    priority: '0.85',
    shortLabel: 'Capo Chord Transposition Calculator',
  },
  {
    canonicalPath: '/guzheng-21-string-modulation-chart',
    priority: '0.85',
    shortLabel: '21-String Guzheng Modulation Chart',
  },
];

/**
 * 9 Core App SEO Pages following GeFei SEO SOP:
 * - 1 Core Keyword per Page ("一个关键词一个页面")
 * - Title: 50-60 characters, [Core Keyword] - [Value Prop] | PluckBench
 * - Description: 150-160 characters, [Problem] + [Solution] + [CTA]
 * - Strictly 1 <h1>, structured <h2> & <h3> hierarchy
 * - Static HTML injected directly into <div id="root">...</div> so view-source: shows full content
 * - The 4 previously "Discovered - currently not indexed" pages (/bass-tuner, /online-metronome,
 *   /guitar-chords, /guzheng-tuner) include 1,600+ words of unique, specialized acoustic engineering guides.
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
    title: 'Online Guitar Tuner - Standard & Drop D Tuning | PluckBench', // 59 chars
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
        a: 'In standard D Major (1=D) tuning, the green strings (Strings 3, 8, 13, and 18 or 4, 9, 14, and 19) serve as visual pentatonic octave landmarks. You can switch display notation to Numbered Musical Notation (Jianpu 1-2-3-5-6) inside the online guzheng tuner.',
      },
      {
        q: 'How do I modulate from D Major to G Major on a Guzheng?',
        a: 'Select Guzheng in the preset bar and switch the tuning variant to G Major, raising the four F# strings (#4, #9, #14, and #19) by +100 cents to G natural by sliding their movable Yanzhu bridges 1.5 to 2.5 cm to the right.',
      },
    ],
    extraSectionsHtml: `
          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 class="text-lg font-bold text-slate-100">
              Complete 21-String Guzheng Frequency Reference &amp; Yanzhu Bridge Modulation Guide
            </h2>
            <p class="text-xs leading-relaxed text-slate-300">
              A concert 21-string Guzheng spans four complete five-note <em>Gong-Shang-Jue-Zhi-Yu</em> (宫商角徵羽) pentatonic octaves from String #21 (<code class="text-emerald-400">D2 = 73.42 Hz</code>, closest to the performer) up to String #1 (<code class="text-emerald-400">D6 = 1174.66 Hz</code>, farthest from the performer). Because the strings pass over 21 individual movable rosewood or bone bridges (<strong>Yanzhu / 雁柱</strong>) resting on a curved Paulownia soundboard, calibrating a Guzheng requires two distinct operations: fine-tuning the right-hand steel tuning pins with a square tuning wrench, and positioning each Yanzhu bridge along its diagonal scale trajectory. For interactive key changes across D, G, C, F, and A Major, open our dedicated <a href="/guzheng-21-string-modulation-chart" class="text-emerald-400 underline">21-String Guzheng Yanzhu Bridge Modulation Chart &amp; Calculator</a>.
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-700 text-slate-400">
                    <th class="py-2 pr-3 font-semibold">String #</th>
                    <th class="py-2 pr-3 font-semibold">1=D Major Note (Jianpu)</th>
                    <th class="py-2 pr-3 font-semibold">Hz (A4=440Hz)</th>
                    <th class="py-2 pr-3 font-semibold">Hz (A4=442Hz)</th>
                    <th class="py-2 pr-3 font-semibold">1=G Major Mod</th>
                    <th class="py-2 font-semibold">1=C Major Mod</th>
                  </tr>
                </thead>
                <tbody class="font-mono">
                  <tr class="border-b border-slate-800/70"><td>#1 (Treble)</td><td class="text-emerald-400">D6 (1 Do)</td><td>1174.66 Hz</td><td>1180.00 Hz</td><td>D6 (5 Sol)</td><td>D6 (2 Re)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#2</td><td class="text-emerald-400">B5 (6 La)</td><td>987.77 Hz</td><td>992.26 Hz</td><td>B5 (3 Mi)</td><td>C6 (1 Do &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>#3 (Green)</td><td class="text-emerald-400">A5 (5 Sol)</td><td>880.00 Hz</td><td>884.00 Hz</td><td>A5 (2 Re)</td><td>A5 (6 La)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#4</td><td class="text-emerald-400">F#5 (3 Mi)</td><td>739.99 Hz</td><td>743.35 Hz</td><td>G5 (1 Do &rarr; Right)</td><td>G5 (5 Sol &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#5</td><td class="text-emerald-400">E5 (2 Re)</td><td>659.25 Hz</td><td>662.25 Hz</td><td>E5 (6 La)</td><td>E5 (3 Mi)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#6</td><td class="text-emerald-400">D5 (1 Do)</td><td>587.33 Hz</td><td>590.00 Hz</td><td>D5 (5 Sol)</td><td>D5 (2 Re)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#7</td><td class="text-emerald-400">B4 (6 La)</td><td>493.88 Hz</td><td>496.13 Hz</td><td>B4 (3 Mi)</td><td>C5 (1 Do &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>#8 (Green Ref)</td><td class="text-emerald-400">A4 (5 Sol)</td><td>440.00 Hz</td><td>442.00 Hz</td><td>A4 (2 Re)</td><td>A4 (6 La)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#9</td><td class="text-emerald-400">F#4 (3 Mi)</td><td>369.99 Hz</td><td>371.68 Hz</td><td>G4 (1 Do &rarr; Right)</td><td>G4 (5 Sol &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#10</td><td class="text-emerald-400">E4 (2 Re)</td><td>329.63 Hz</td><td>331.13 Hz</td><td>E4 (6 La)</td><td>E4 (3 Mi)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#11</td><td class="text-emerald-400">D4 (1 Do)</td><td>293.66 Hz</td><td>295.00 Hz</td><td>D4 (5 Sol)</td><td>D4 (2 Re)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#12</td><td class="text-emerald-400">B3 (6 La)</td><td>246.94 Hz</td><td>248.07 Hz</td><td>B3 (3 Mi)</td><td>C4 (1 Do &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>#13 (Green)</td><td class="text-emerald-400">A3 (5 Sol)</td><td>220.00 Hz</td><td>221.00 Hz</td><td>A3 (2 Re)</td><td>A3 (6 La)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#14</td><td class="text-emerald-400">F#3 (3 Mi)</td><td>185.00 Hz</td><td>185.84 Hz</td><td>G3 (1 Do &rarr; Right)</td><td>G3 (5 Sol &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#15</td><td class="text-emerald-400">E3 (2 Re)</td><td>164.81 Hz</td><td>165.56 Hz</td><td>E3 (6 La)</td><td>E3 (3 Mi)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#16</td><td class="text-emerald-400">D3 (1 Do)</td><td>146.83 Hz</td><td>147.50 Hz</td><td>D3 (5 Sol)</td><td>D3 (2 Re)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#17</td><td class="text-emerald-400">B2 (6 La)</td><td>123.47 Hz</td><td>124.03 Hz</td><td>B2 (3 Mi)</td><td>C3 (1 Do &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>#18 (Green)</td><td class="text-emerald-400">A2 (5 Sol)</td><td>110.00 Hz</td><td>110.50 Hz</td><td>A2 (2 Re)</td><td>A2 (6 La)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#19</td><td class="text-emerald-400">F#2 (3 Mi)</td><td>92.50 Hz</td><td>92.92 Hz</td><td>G2 (1 Do &rarr; Right)</td><td>G2 (5 Sol &rarr; Right)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#20</td><td class="text-emerald-400">E2 (2 Re)</td><td>82.41 Hz</td><td>82.78 Hz</td><td>E2 (6 La)</td><td>E2 (3 Mi)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>#21 (Bass)</td><td class="text-emerald-400">D2 (1 Do)</td><td>73.42 Hz</td><td>73.75 Hz</td><td>D2 (5 Sol)</td><td>D2 (2 Re)</td></tr>
                </tbody>
              </table>
            </div>
            <h3 class="text-sm font-bold text-slate-100">
              Why Guzheng Silk-Steel Strings Require Attack-Transient Filtering &amp; Equalized Bridge Tension
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Modern concert Guzheng strings consist of a high-tensile steel core wrapped in nylon and braided copper filaments spanning roughly 163 cm from the right fixed bridge (YueShan / 岳山) to the left S-shaped dragon tail (LongWei). When plucked with tortoise-shell or Delrin finger picks (YiJia), the initial displacement of a long, flexible string creates a momentary tension surge that pushes instantaneous frequency 20 to 45 cents sharp during the first 100 milliseconds. Standard clip-on guitar tuners latch onto that initial sharp chirp, tricking players into tuning their Guzheng flat. Our sustain-phase pitch tracker discards the first 110ms attack transient and weights the 150ms–650ms harmonic sustain plateau where the true pentatonic fundamental stabilizes.
            </p>
            <p class="text-xs leading-relaxed text-slate-300">
              Furthermore, whenever you slide a Yanzhu bridge to the right to raise pitch (for example, moving Strings #4, #9, #14, and #19 from F# to G for 1=G Major), string friction over the bone bridge groove leaves higher tension on the right playing segment than on the left non-playing segment. Always press the string downward firmly on the left side of the Yanzhu bridge once after sliding it—just as you would execute a left-hand RouXian (揉弦) vibrato—so mechanical tension equalizes across both sides of the bridge before reading the final Hertz value. If you also play bowed orchestral strings at 442 Hz, compare temperaments on our <a href="/violin-tuner" class="text-emerald-400 underline">Online Violin &amp; 442Hz Orchestral Tuner</a>.
            </p>
          </section>`,
  },
  {
    slug: 'bass-tuner',
    canonicalPath: '/bass-tuner',
    priority: '0.85',
    keyword: 'online bass tuner',
    title: 'Online Bass Tuner - 4 & 5 String Sub-Bass Lock | PluckBench', // 59 chars
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
    extraSectionsHtml: `
          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 class="text-lg font-bold text-slate-100">
              Sub-Bass Acoustic Physics: 4-String, 5-String &amp; 6-String Bass Frequency &amp; Tension Guide
            </h2>
            <p class="text-xs leading-relaxed text-slate-300">
              An electric or acoustic bass guitar operates in the lowest fundamental octave of modern ensemble music, where a single wave period of a 5-string low <code class="text-emerald-400">B0 (30.87 Hz)</code> lasts <code class="text-emerald-400">32.39 milliseconds</code> and a 4-string low <code class="text-emerald-400">E1 (41.20 Hz)</code> lasts <code class="text-emerald-400">24.27 milliseconds</code>. Because compact smartphone and laptop microphone capsules exhibit a physical acoustic high-pass roll-off below 65 Hz, upwards of 80% of the captured acoustic energy from an open B0 or E1 string resides in the 2nd harmonic (<code class="text-emerald-400">2f0: B1 = 61.74 Hz, E2 = 82.41 Hz</code>), 3rd harmonic (<code class="text-emerald-400">3f0: F#2 = 92.60 Hz, B2 = 123.61 Hz</code>), and 4th harmonic (<code class="text-emerald-400">4f0</code>). To calculate exact string tension changes when dropping to D1, C1, or Drop A0, use our interactive <a href="/drop-d-alternate-guitar-tuning-chart" class="text-emerald-400 underline">Drop D, Drop C &amp; Sub-Bass Tuning Frequency &amp; Tension Calculator</a>.
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-700 text-slate-400">
                    <th class="py-2 pr-3 font-semibold">Bass Tuning Preset</th>
                    <th class="py-2 pr-3 font-semibold">String Notes (Low to High)</th>
                    <th class="py-2 pr-3 font-semibold">Fundamental Frequencies (Hz)</th>
                    <th class="py-2 pr-3 font-semibold">12th-Fret Harmonic (2f0)</th>
                    <th class="py-2 font-semibold">Recommended Scale &amp; Gauge</th>
                  </tr>
                </thead>
                <tbody class="font-mono">
                  <tr class="border-b border-slate-800/70"><td>4-String Standard (EADG)</td><td class="text-emerald-400">E1 – A1 – D2 – G2</td><td>41.20 – 55.00 – 73.42 – 98.00 Hz</td><td>82.41 – 196.00 Hz</td><td>34" Scale | .045 – .105</td></tr>
                  <tr class="border-b border-slate-800/70"><td>4-String Drop D (DADG)</td><td class="text-emerald-400">D1 – A1 – D2 – G2</td><td>36.71 – 55.00 – 73.42 – 98.00 Hz</td><td>73.42 – 196.00 Hz</td><td>34" Scale | .050 – .110</td></tr>
                  <tr class="border-b border-slate-800/70"><td>4-String Half-Step Down (Eb)</td><td class="text-emerald-400">Eb1 – Ab1 – Db2 – Gb2</td><td>38.89 – 51.91 – 69.30 – 92.50 Hz</td><td>77.78 – 185.00 Hz</td><td>34" Scale | .045 – .105</td></tr>
                  <tr class="border-b border-slate-800/70"><td>4-String D Standard / Drop C</td><td class="text-emerald-400">C1/D1 – G1 – C2 – F2</td><td>32.70/36.71 – 49.00 – 65.41 – 87.31 Hz</td><td>65.41 – 174.61 Hz</td><td>34"-35" | .055 – .115</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>5-String Standard (BEADG)</td><td class="text-emerald-400">B0 – E1 – A1 – D2 – G2</td><td>30.87 – 41.20 – 55.00 – 73.42 – 98.00 Hz</td><td>61.74 – 196.00 Hz</td><td>34"-35" | .045 – .130</td></tr>
                  <tr class="border-b border-slate-800/70"><td>5-String Drop A (AEADG)</td><td class="text-emerald-400">A0 – E1 – A1 – D2 – G2</td><td>27.50 – 41.20 – 55.00 – 73.42 – 98.00 Hz</td><td>55.00 – 196.00 Hz</td><td>35"-37" Multiscale | .135-.145</td></tr>
                  <tr class="border-b border-slate-800/70"><td>5-String Tenor High C (EADGC)</td><td class="text-emerald-400">E1 – A1 – D2 – G2 – C3</td><td>41.20 – 55.00 – 73.42 – 98.00 – 130.81 Hz</td><td>82.41 – 261.63 Hz</td><td>34" Scale | .032 – .105</td></tr>
                  <tr class="border-b border-slate-800/70"><td>6-String Extended (BEADGC)</td><td class="text-emerald-400">B0 – E1 – A1 – D2 – G2 – C3</td><td>30.87 – 41.20 – 55.00 – 73.42 – 98.00 – 130.81 Hz</td><td>61.74 – 261.63 Hz</td><td>35" Scale | .032 – .130</td></tr>
                </tbody>
              </table>
            </div>
            <h3 class="text-sm font-bold text-slate-100">
              How McLeod Sub-Bass Autocorrelation &amp; Neck Pickup Selection Prevent Octave Jumping
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Ordinary zero-crossing and short-buffer FFT tuners frequently jump between E1 (41.20 Hz) and E2 (82.41 Hz) or misidentify the strong 3rd harmonic of B0 (F#2 = 92.60 Hz) as a wrong note. PluckBench solves this by extending the time-domain autocorrelation lag search down to 25 Hz and cross-checking the Normalized Square Difference Function (NSDF) peaks at integer sub-multiples. To feed the cleanest possible sine-like fundamental into your microphone or audio interface: (1) solo the <strong>neck pickup</strong> (which sits near the anti-node of the fundamental standing wave, whereas the bridge pickup emphasizes upper metallic overtones); (2) roll your passive tone knob back to 50%; (3) mute all unplayed strings with your fretting hand so sympathetic resonance on B0 or E1 does not bleed into A1 or D2; and (4) if tuning unplugged in a noisy room, chime the <strong>12th-fret natural harmonic</strong>, which projects at exactly twice the fundamental frequency (<code class="text-emerald-400">61.74 Hz</code> for B0 and <code class="text-emerald-400">82.41 Hz</code> for E1) right where mobile microphones have peak sensitivity. Pair your bass setup with our <a href="/guitar-tuner" class="text-emerald-400 underline">Online Guitar Tuner</a> and <a href="/online-metronome" class="text-emerald-400 underline">Zero-Drift Online Metronome</a> for tight rhythm section lock.
            </p>
            <h3 class="text-sm font-bold text-slate-100">
              Scale Length Physics (30" Short-Scale vs 34" Long-Scale vs 35"-37" Multiscale) &amp; Bridge Saddle Intonation
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Why do 5-string bass luthiers favor 35-inch extra-long scale or 34"–37" fanned-fret multiscale fingerboards for the low B0 (30.87 Hz) and Drop A0 (27.50 Hz) strings? According to Mersenne's Law, vibrating string tension increases with the square of scale length ($L^2$). Increasing speaking length from a standard 34-inch Fender Precision/Jazz Bass scale to a 35-inch scale adds $(35/34)^2 - 1 = +5.97\%$ tension at the exact same pitch, while a 37-inch multiscale B0 string adds $+18.43\%$ tension. Higher mechanical tension reduces elliptical string excursion during hard fingerstyle or pick attacks, eliminating both low-fret rattle and the +25 cent sharp attack pitch drift that plagues loose sub-bass strings. Conversely, 30-inch short-scale basses lose $22.1\%$ tension compared to 34-inch basses at the same gauge, requiring thicker <code class="text-emerald-400">.050–.110</code> or flatwound strings to maintain fundamental focus.
            </p>
            <p class="text-xs leading-relaxed text-slate-300">
              When setting 12th-fret bridge saddle intonation on an electric bass with this online bass tuner, always use taper-core or exposed-core strings on the B0 (.130") and E1 (.105") positions if your saddles are nearing the rear limit of the bridge plate. Because thick double-wound bass strings have substantial bending stiffness where they cross the saddle witness point, press down firmly on the string directly behind the saddle after installing fresh strings to seat the break angle before comparing the 12th-fret natural harmonic against the fretted 12th-fret note.
            </p>
          </section>`,
  },
  {
    slug: 'online-metronome',
    canonicalPath: '/online-metronome',
    priority: '0.85',
    keyword: 'online metronome',
    title: 'Online Metronome - Tap BPM & Visual Beat Pulse | PluckBench', // 59 chars
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
    extraSectionsHtml: `
          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 class="text-lg font-bold text-slate-100">
              Hardware-Clock Lookahead Scheduling vs JavaScript Timer Jitter &amp; BPM-to-Millisecond Math
            </h2>
            <p class="text-xs leading-relaxed text-slate-300">
              Why do so many browser-based click tracks feel unsteady at 140+ BPM? Naive web metronomes rely on <code class="text-emerald-400">window.setInterval()</code> or <code class="text-emerald-400">requestAnimationFrame()</code>, which run on the single-threaded browser UI loop alongside DOM layout rendering and garbage collection. Whenever a frame drops, a main-thread timer can stall by <code class="text-emerald-400">12 ms to 45 ms</code>—more than enough for a trained drummer, guitarist, or violinist to perceive a stumbling groove. PluckBench implements Chris Wilson's two-clock <strong>Web Audio API Lookahead Scheduler</strong>: a lightweight lookahead loop wakes up every 25ms and schedules upcoming downbeat and subdivision oscillator envelopes directly onto <code class="text-emerald-400">AudioContext.currentTime</code>, which is driven by your soundcard's crystal hardware clock at 44,100 or 48,000 samples per second (<code class="text-emerald-400">±0.02 ms</code> sample accuracy). Need to convert your metronome BPM into exact delay pedal milliseconds or reverb pre-delay times? Use our <a href="/bpm-to-ms-delay-time-calculator" class="text-emerald-400 underline">BPM to Milliseconds (ms) Delay Time, Pre-Delay &amp; LFO Hz Calculator</a>.
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-700 text-slate-400">
                    <th class="py-2 pr-3 font-semibold">Classical Tempo Marking</th>
                    <th class="py-2 pr-3 font-semibold">BPM Range</th>
                    <th class="py-2 pr-3 font-semibold">1/4 Note Beat (ms)</th>
                    <th class="py-2 pr-3 font-semibold">1/8 Subdivision (ms)</th>
                    <th class="py-2 pr-3 font-semibold">1/16 Subdivision (ms)</th>
                    <th class="py-2 font-semibold">Primary Practice Application</th>
                  </tr>
                </thead>
                <tbody class="font-mono">
                  <tr class="border-b border-slate-800/70"><td>Grave / Largo</td><td class="text-emerald-400">40 – 60 BPM</td><td>1500.0 – 1000.0 ms</td><td>750.0 – 500.0 ms</td><td>375.0 – 250.0 ms</td><td>Long-tone bow control &amp; slow finger transitions</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Larghetto / Adagio</td><td class="text-emerald-400">60 – 76 BPM</td><td>1000.0 – 789.5 ms</td><td>500.0 – 394.7 ms</td><td>250.0 – 197.4 ms</td><td>Expressive ballads, vibrato pacing &amp; sight-reading</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Andante / Moderato</td><td class="text-emerald-400">76 – 112 BPM</td><td>789.5 – 535.7 ms</td><td>394.7 – 267.9 ms</td><td>197.4 – 133.9 ms</td><td>Pop/folk strumming, boom-chick &amp; 16th-note funk</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>Allegro (Studio Mid)</td><td class="text-emerald-400">112 – 152 BPM</td><td>535.7 – 394.7 ms</td><td>267.9 – 197.4 ms</td><td>133.9 – 98.7 ms</td><td>Rock/EDM tempo grid, classical sonatas &amp; arpeggios</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Vivace / Presto</td><td class="text-emerald-400">152 – 200 BPM</td><td>394.7 – 300.0 ms</td><td>197.4 – 150.0 ms</td><td>98.7 – 75.0 ms</td><td>Fast alternate picking, bluegrass flatpicking &amp; jazz</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Prestissimo</td><td class="text-emerald-400">200 – 260 BPM</td><td>300.0 – 230.8 ms</td><td>150.0 – 115.4 ms</td><td>75.0 – 57.7 ms</td><td>Bebop horn lines, blast beats &amp; virtuosic etudes</td></tr>
                </tbody>
              </table>
            </div>
            <h3 class="text-sm font-bold text-slate-100">
              Mastering Odd Time Signatures (5/4, 6/8, 7/8) &amp; The Backbeat Internalization Drill
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Practicing in simple duple (<code class="text-emerald-400">2/4</code>), triple (<code class="text-emerald-400">3/4</code>), or common time (<code class="text-emerald-400">4/4</code>) builds foundational pulse, while switching to compound meter (<code class="text-emerald-400">6/8</code>, felt as two dotted-quarter macro-beats subdivided into <code class="text-emerald-400">1-2-3, 4-5-6</code>) or asymmetric meters (<code class="text-emerald-400">5/4</code> grouped as <code class="text-emerald-400">3+2</code> or <code class="text-emerald-400">2+3</code>) sharpens downbeat awareness. To build rock-solid internal time on guitar, bass, or ukulele: (1) start at a comfortable tempo where you can play three consecutive loops with zero mistakes; (2) increase speed in <code class="text-emerald-400">+4 BPM</code> micro-steps using the progressive speed-up ladder; and (3) cut the BPM in half (for example, set <code class="text-emerald-400">55 BPM</code> instead of <code class="text-emerald-400">110 BPM</code>) and hear each click as <strong>Beats 2 and 4</strong> (the snare backbeat) rather than Beats 1 and 3. Combining backbeat metronome practice with our <a href="/guitar-chords" class="text-emerald-400 underline">Interactive Guitar &amp; Ukulele Chord Library</a> and <a href="/decibel-meter" class="text-emerald-400 underline">Acoustic Decibel Meter</a> ensures both your groove pocket and dynamic control stay studio-ready.
            </p>
            <h3 class="text-sm font-bold text-slate-100">
              Subdivision Hierarchy, Polyrhythm Counting (3:2 &amp; 4:3) &amp; Acoustic Click Timbre Selection
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              When practicing slow ballads below <code class="text-emerald-400">65 BPM</code>, the temporal gap between quarter-note clicks exceeds <code class="text-emerald-400">923 milliseconds</code>, tempting musicians to rush the middle of each beat. Subdividing the pulse into eighth notes (<code class="text-emerald-400">1-&amp;-2-&amp;</code>), triplets (<code class="text-emerald-400">1-trip-let</code>), or sixteenth notes (<code class="text-emerald-400">1-e-&amp;-a</code>) fills the acoustic space with a micro-grid that locks right-hand strumming, alternate picking, and violin bow changes into place. For advanced rhythm training, use the accented downbeat click to practice <strong>3-against-2 (hemiola)</strong> and <strong>4-against-3 polyrhythms</strong>: find the lowest common multiple of the two rhythmic layers (6 sub-pulses for 3:2, where layer A lands on pulses 1, 3, 5 and layer B lands on pulses 1, 4; or 12 sub-pulses for 4:3, where the 4-beat hand lands on pulses 1, 4, 7, 10 and the 3-beat hand lands on pulses 1, 5, 9).
            </p>
            <p class="text-xs leading-relaxed text-slate-300">
              Click timbre also influences timing perception in live rooms. High-pitched electronic square-wave beeps can cause ear fatigue during long headphone sessions or get masked by bright cymbal and acoustic guitar transients. Switching this online metronome to the warm synthesized <strong>Woodblock</strong> or <strong>Rimshot Click</strong> concentrates acoustic energy between <code class="text-emerald-400">800 Hz and 2,400 Hz</code> with a crisp 8-millisecond transient decay that cuts cleanly through acoustic guitar, piano, bass, or bowed string practice without harshness.
            </p>
            <p class="text-xs leading-relaxed text-slate-300">
              For silent visual tempo training or orchestral pit rehearsal where audible clicks would bleed into condenser microphones, combine the high-contrast LED beat pulse indicators at the top of the metronome panel with peripheral vision counting. Each beat cell illuminates in synchronization with the Web Audio hardware schedule, distinguishing the accented Measure Downbeat (Beat 1) from inner quarter-note pulses so you can verify tempo stability during unaccompanied drum fills, cadenza passages, or choir conducting prep.
            </p>
          </section>`,
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
    extraSectionsHtml: `
          <section class="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h2 class="text-lg font-bold text-slate-100">
              Fretboard Harmony Decoded: Chord Interval Formulas, CAGED Voicings &amp; Barre Chord Biomechanics
            </h2>
            <p class="text-xs leading-relaxed text-slate-300">
              Every voicing in our interactive guitar and ukulele chord dictionary is constructed from fixed scale intervals stacked above the root note (<code class="text-emerald-400">1</code>). Because a standard 6-string guitar is tuned in Perfect Fourths (<code class="text-emerald-400">E2–A2–D3–G3</code>) with a single Major Third between the 3rd and 2nd strings (<code class="text-emerald-400">G3–B3</code>) and another Perfect Fourth to the 1st string (<code class="text-emerald-400">B3–E4</code>), six-string chords naturally double root and fifth degrees across two octaves while placing the color-defining third or seventh in the upper-middle strings. Need to transpose an open chord progression to match your vocal range with a capo? Open our <a href="/capo-transposition-chord-chart-calculator" class="text-emerald-400 underline">Guitar &amp; Ukulele Capo Transposition Chart &amp; Key Calculator</a>.
            </p>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-700 text-slate-400">
                    <th class="py-2 pr-3 font-semibold">Chord Quality &amp; Symbol</th>
                    <th class="py-2 pr-3 font-semibold">Interval Formula</th>
                    <th class="py-2 pr-3 font-semibold">Semitone Structure</th>
                    <th class="py-2 pr-3 font-semibold">Example Notes (C Root)</th>
                    <th class="py-2 font-semibold">Harmonic Function &amp; Genre Color</th>
                  </tr>
                </thead>
                <tbody class="font-mono">
                  <tr class="border-b border-slate-800/70"><td>Major Triad (C, G, D, A, E)</td><td class="text-emerald-400">1 – 3 – 5</td><td>0 – 4 – 7 ST</td><td>C – E – G</td><td>Bright, stable tonic (I), subdominant (IV) or dominant (V)</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Minor Triad (Am, Dm, Em, Bm)</td><td class="text-emerald-400">1 – b3 – 5</td><td>0 – 3 – 7 ST</td><td>C – Eb – G</td><td>Melancholic, expressive minor tonic (i) or vi/ii chords</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Dominant 7th (G7, C7, D7, E7)</td><td class="text-emerald-400">1 – 3 – 5 – b7</td><td>0 – 4 – 7 – 10 ST</td><td>C – E – G – Bb</td><td>Contains tritone between 3 and b7; pulls strongly to I</td></tr>
                  <tr class="border-b border-slate-800/70 bg-emerald-950/20"><td>Major 7th (Cmaj7, Fmaj7, Gmaj7)</td><td class="text-emerald-400">1 – 3 – 5 – 7</td><td>0 – 4 – 7 – 11 ST</td><td>C – E – G – B</td><td>Warm, dreamy jazz, neo-soul, bossa nova &amp; indie voicings</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Minor 7th (Am7, Dm7, Em7)</td><td class="text-emerald-400">1 – b3 – 5 – b7</td><td>0 – 3 – 7 – 10 ST</td><td>C – Eb – G – Bb</td><td>Smooth, low-tension ii7 funk, R&amp;B &amp; acoustic groove chord</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Suspended 4th (Dsus4, Asus4, Esus4)</td><td class="text-emerald-400">1 – 4 – 5</td><td>0 – 5 – 7 ST</td><td>C – F – G</td><td>Replaces 3rd with 4th for open folk/rock tension &amp; release</td></tr>
                  <tr class="border-b border-slate-800/70"><td>Added 9th (Cadd9, Gadd9, Dadd2)</td><td class="text-emerald-400">1 – 3 – 5 – 9</td><td>0 – 4 – 7 – 14 ST</td><td>C – E – G – D</td><td>Shimmering pop/country acoustic strumming without a 7th</td></tr>
                </tbody>
              </table>
            </div>
            <h3 class="text-sm font-bold text-slate-100">
              How to Play Clean Barre Chords (F Major &amp; B Minor) Without Left-Hand Thumb Fatigue
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Beginners often struggle with the 1st-fret <code class="text-emerald-400">F Major</code> (E-shape movable barre) and 2nd-fret <code class="text-emerald-400">B Minor</code> (A-shape movable barre) because they try to clamp all six strings using pure thumb-to-index pinching force. Instead, apply three classical luthier biomechanics tips: (1) <strong>Roll your index finger 20 degrees toward the nut</strong> so the bony outer lateral edge of your finger contacts the strings rather than the soft fleshy pad under the finger joints; (2) <strong>Place the barre 2 mm behind the metal fret wire</strong>, where required downward pressure is 40% lower than in the middle of the fret space; and (3) <strong>Use right-arm counterweight leverage</strong> by gently pulling the guitar body back against your ribs with your right forearm, allowing shoulder posture—not thumb squeezing—to fret the barre cleanly. Always verify that your open strings are tuned to exact concert pitch on our <a href="/guitar-tuner" class="text-emerald-400 underline">Online Guitar Tuner</a> or <a href="/ukulele-tuner" class="text-emerald-400 underline">Online Ukulele Tuner</a> before practicing new chord voicings.
            </p>
            <h3 class="text-sm font-bold text-slate-100">
              Voice Leading, Anchor Fingers &amp; High-G Ukulele Re-Entrant Chord Voicings
            </h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Smooth chord transitions depend on identifying <strong>common-tone anchor fingers</strong>—fingers that remain on the exact same string and fret between two adjacent chords in a progression. When switching between <code class="text-emerald-400">C Major (x-3-2-0-1-0)</code> and <code class="text-emerald-400">A Minor (x-0-2-2-1-0)</code>, both your 1st finger (C4 on the 2nd string, Fret 1) and 2nd finger (E3 on the 4th string, Fret 2) stay planted; only your 3rd finger moves from the 5th string (Fret 3) to the 3rd string (Fret 2). Similarly, when moving between modern pop voicings of <code class="text-emerald-400">G Major (3-2-0-0-3-3)</code>, <code class="text-emerald-400">Cadd9 (x-3-2-0-3-3)</code>, <code class="text-emerald-400">Em7 (0-2-2-0-3-3)</code>, and <code class="text-emerald-400">Dsus4 (x-x-0-2-3-3)</code>, locking your 3rd and 4th fingers onto the 3rd fret of the B3 and E4 strings creates a seamless pedal-point shimmer across the entire four-chord loop.
            </p>
            <p class="text-xs leading-relaxed text-slate-300">
              When you toggle this guitar chord library to <strong>4-String Ukulele mode (G4-C4-E4-A4)</strong>, notice how re-entrant High-G tuning places the 4th string (<code class="text-emerald-400">G4 = 392.00 Hz</code>) only a whole step below the 1st string (<code class="text-emerald-400">A4 = 440.00 Hz</code>). This close-voiced cluster layout allows four-note seventh chords—such as <code class="text-emerald-400">Cmaj7 (0-0-0-2)</code>, <code class="text-emerald-400">Am7 (0-0-0-0)</code>, and <code class="text-emerald-400">Fmaj7 (2-4-1-3)</code>—to ring with a harp-like close-interval warmth that is impossible on linearly tuned instruments. Click the Strum button on any diagram to audition the staggered 35-millisecond Karplus-Strong acoustic pluck envelope and train your ear to recognize each chord quality immediately.
            </p>
            <p class="text-xs leading-relaxed text-slate-300">
              For songwriters and acoustic arrangers working in standard E2–E4 guitar tuning, pay close attention to <strong>low-interval limits</strong> on the wound 6th (E2 = 82.41 Hz) and 5th (A2 = 110.00 Hz) strings. Playing narrow major or minor thirds below D3 (146.83 Hz)—such as fretting both the 6th string and 5th string inside an open G Major shape—can sound muddy on dreadnought acoustic guitars with strong 100 Hz air-cavity resonance. Muting the 5th string in open G or voicing the third an octave higher on the G3 or B3 string keeps acoustic rhythm tracks articulate and balanced.
            </p>
          </section>`,
  },
  {
    slug: 'decibel-meter',
    canonicalPath: '/decibel-meter',
    priority: '0.8',
    keyword: 'online decibel meter',
    title: 'Online Decibel Meter - Real-Time Room Sound dB | PluckBench', // 59 chars
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

  const appLinksHtml = SEO_PAGES.map(
    (p) =>
      `<a href="${p.canonicalPath}" class="px-2.5 py-1.5 rounded-lg border border-slate-700/70 text-xs text-slate-300 hover:text-emerald-400">${p.title.split(' - ')[0].split(' | ')[0]}</a>`
  ).join('\n              ');

  const calcLinksHtml = LIVE_CALCULATOR_PAGES.map(
    (c) =>
      `<a href="${c.canonicalPath}" class="px-2.5 py-1.5 rounded-lg border border-emerald-800/70 bg-emerald-950/20 text-xs text-emerald-300 hover:text-emerald-200">${c.shortLabel}</a>`
  ).join('\n              ');

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

  const extraHtml = page.extraSectionsHtml || '';

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

        <div class="max-w-7xl mx-auto px-4 py-8 min-h-[78vh] flex items-center justify-center">
          <div class="w-full max-w-2xl p-8 rounded-3xl border border-slate-800 bg-slate-900/80 text-center space-y-4">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              Web Audio DSP Workbench Ready
            </div>
            <div class="text-2xl font-extrabold text-slate-100">PluckBench Pro</div>
            <div class="text-xs text-slate-400">${page.tuningSummary}</div>
          </div>
        </div>

        <main class="max-w-7xl mx-auto px-4 py-6 space-y-8 opacity-90">
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
              For cross-platform convenience, all digital signal processing runs natively via the Web Audio API on desktop laptops, iPad tablets, and iOS or Android phones without installing plugins or uploading microphone audio to external servers. You can also customize concert pitch calibration from A4 = 430 Hz to 450 Hz, switch between 12-Tone Equal Temperament, Just Intonation, and Pythagorean tuning, or jump directly to our specialized <a href="/bass-tuner" class="text-emerald-400 underline">4 &amp; 5-String Sub-Bass Tuner</a>, <a href="/guzheng-tuner" class="text-emerald-400 underline">21-String Guzheng Tuner</a>, <a href="/online-metronome" class="text-emerald-400 underline">Zero-Drift Online Metronome</a>, and <a href="/guitar-chords" class="text-emerald-400 underline">Interactive Guitar &amp; Ukulele Chord Library</a>.
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
          </section>${extraHtml}

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
              Explore All Dedicated Online Instrument Tuners, Music Practice Tools &amp; Acoustic Calculators
            </h2>
            <p class="text-xs text-slate-400">
              Switch directly to any specialized instrument tuner or interactive studio engineering calculator in the PluckBench suite below:
            </p>
            <nav aria-label="PluckBench Music Tools Navigation" class="flex flex-wrap gap-2">
              ${appLinksHtml}
              ${calcLinksHtml}
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
  const allEntries = [...SEO_PAGES, ...LIVE_CALCULATOR_PAGES];
  const urls = allEntries
    .map(
      (page) => `  <url>
    <loc>${SITE_ORIGIN}${page.canonicalPath}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

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
  const totalUrls = SEO_PAGES.length + LIVE_CALCULATOR_PAGES.length;
  console.log('--------------------------------------------------------------------------------');
  console.log(`✓ Generated sitemap.xml with ${totalUrls} canonical URLs (${SEO_PAGES.length} core + ${LIVE_CALCULATOR_PAGES.length} calculator guides).`);
  console.log('================================================================================\n');
}

main();
