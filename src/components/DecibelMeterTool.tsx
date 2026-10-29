import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemePalette, SupportedLang, UI_TEXT } from '../i18n/localeTheme';
import { Mic, MicOff, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

const DB_TEXT: Record<
  SupportedLang,
  {
    title: string;
    subtitle: string;
    resetTitle: string;
    startBtn: string;
    stopBtn: string;
    curLabel: string;
    avgLabel: string;
    minLabel: string;
    peakLabel: string;
    specTitle: string;
    specRunning: string;
    specIdle: string;
    quietMsg: string;
    modMsg: string;
    noisyMsg: string;
    micErr: string;
  }
> = {
  zh: {
    title: '环境噪音分贝仪 & 实时频谱分析',
    subtitle: '实时评估当前房间底噪是否适合原声乐器拾音调弦，并提供降噪建议',
    resetTitle: '重置统计峰值',
    startBtn: '开始检测环境噪音',
    stopBtn: '停止检测',
    curLabel: '当前声压估算',
    avgLabel: '平均底噪',
    minLabel: '最低安静值',
    peakLabel: '瞬态峰值',
    specTitle: '实时环境声学频谱分布 (20Hz ~ 8000Hz)',
    specRunning: '实时采样中',
    specIdle: '点击上方按钮开始采样',
    quietMsg: '当前声学环境极佳（≤52 dB）：非常适合进行木吉他、古筝、小提琴等原声乐器的高精度微米级调音。',
    modMsg: '当前存在一定环境背景音（53~68 dB）：建议在调音器顶部开启「强效抗噪」模式，并将麦克风靠近乐器音孔 20~30cm 内。',
    noisyMsg: '当前环境非常嘈杂（>68 dB）：强烈建议开启调音器的「强效抗噪 + 选弦调音」模式，或使用原声基准音耳调。',
    micErr: '无法开启麦克风测量环境分贝',
  },
  en: {
    title: 'Ambient Noise Decibel Meter & Real-Time Spectrum Analyzer',
    subtitle: 'Evaluate whether room acoustics are quiet enough for precision instrument tuning',
    resetTitle: 'Reset Peak Stats',
    startBtn: 'Start Noise Meter',
    stopBtn: 'Stop Meter',
    curLabel: 'Current SPL',
    avgLabel: 'Average SPL',
    minLabel: 'Minimum SPL',
    peakLabel: 'Peak SPL',
    specTitle: 'Real-Time Acoustic Spectrum (20Hz – 8000Hz)',
    specRunning: 'Sampling Live Audio',
    specIdle: 'Tap "Start Noise Meter" above to begin',
    quietMsg: 'Quiet Acoustic Environment (≤52 dB): Ideal for high-precision acoustic tuning of guitar, violin, and zither.',
    modMsg: 'Moderate Room Noise (53–68 dB): Enable the Narrow-Band Noise Filter in the top bar and place your mic within 25cm of the instrument.',
    noisyMsg: 'High Ambient Noise (>68 dB): Strongly recommend enabling Narrow-Band Noise Filter + String Lock Mode.',
    micErr: 'Unable to access microphone for decibel measurement',
  },
  ja: {
    title: '環境騒音計 ＆ リアルタイム周波数スペクトラム分析',
    subtitle: '現在の部屋の静けさが楽器の精密チューニングに適しているかをリアルタイム診断します',
    resetTitle: '統計をリセット',
    startBtn: '騒音測定を開始',
    stopBtn: '測定停止',
    curLabel: '現在の推定騒音',
    avgLabel: '平均ノイズ',
    minLabel: '最小値',
    peakLabel: 'ピーク最大値',
    specTitle: 'リアルタイム音響スペクトラム (20Hz ～ 8000Hz)',
    specRunning: 'リアルタイム測定中',
    specIdle: '上の「騒音測定を開始」をタップしてください',
    quietMsg: '極めて良好な音響環境（≤52 dB）：アコースティックギター・古筝・バイオリンの精密チューニングに最適です。',
    modMsg: '周囲にやや生活音があります（53～68 dB）：上部の「ノイズ除去」をONにし、マイクを楽器に近づけてください。',
    noisyMsg: '周囲が騒がしい環境です（>68 dB）：「ノイズ除去 ＋ 弦指定モード」を併用するか、基準音での耳調律を推奨します。',
    micErr: 'マイクへのアクセスが許可されていません',
  },
};

export const DecibelMeterTool: React.FC<{
  theme: ThemePalette;
  lang: SupportedLang;
}> = ({ theme, lang }) => {
  const txt = DB_TEXT[lang];
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSplDb, setCurrentSplDb] = useState<number>(32);
  const [peakSplDb, setPeakSplDb] = useState<number>(32);
  const [minSplDb, setMinSplDb] = useState<number>(85);
  const [avgSplDb, setAvgSplDb] = useState<number>(35);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<number[]>([]);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startMeter = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);

      audioCtxRef.current = ctx;
      streamRef.current = stream;
      setIsRunning(true);

      const timeBuf = new Float32Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getFloatTimeDomainData(timeBuf);
        analyser.getByteFrequencyData(freqBuf);

        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) {
          sum += timeBuf[i] * timeBuf[i];
        }
        const rms = Math.sqrt(sum / timeBuf.length);
        const dbfs = rms > 1e-6 ? 20 * Math.log10(rms) : -95;
        const estSpl = Math.max(26, Math.min(108, Math.round(dbfs + 105)));

        setCurrentSplDb((prev) => Math.round(prev * 0.75 + estSpl * 0.25));
        setPeakSplDb((p) => Math.max(p, estSpl));
        setMinSplDb((m) => Math.min(m, estSpl));

        samplesRef.current.push(estSpl);
        if (samplesRef.current.length > 180) samplesRef.current.shift();
        const avg =
          samplesRef.current.reduce((a, b) => a + b, 0) /
          samplesRef.current.length;
        setAvgSplDb(Math.round(avg));

        const canvas = canvasRef.current;
        if (canvas) {
          const c = canvas.getContext('2d');
          if (c) {
            const w = canvas.width;
            const h = canvas.height;
            c.clearRect(0, 0, w, h);
            const bars = 48;
            const barW = w / bars - 2;
            for (let b = 0; b < bars; b++) {
              const val = freqBuf[b * 3] / 255;
              const barH = Math.max(3, val * (h - 10));
              c.fillStyle =
                val > 0.75
                  ? theme.dangerHex
                  : val > 0.45
                  ? theme.warnHex
                  : theme.accentHex;
              c.fillRect(b * (barW + 2), h - barH, barW, barH);
            }
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : txt.micErr);
    }
  };

  useEffect(() => {
    return () => stopMeter();
  }, [stopMeter]);

  const isQuietForTuning = currentSplDb <= 52;
  const isModerateNoise = currentSplDb > 52 && currentSplDb <= 68;

  return (
    <div
      className="w-full rounded-2xl border p-4 sm:p-6 shadow-xl space-y-5 transition-colors duration-300"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.borderPrimary,
        color: theme.textPrimary,
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: theme.borderPrimary }}
      >
        <div>
          <h2 className="text-base sm:text-lg font-bold">{txt.title}</h2>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {txt.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPeakSplDb(currentSplDb);
              setMinSplDb(currentSplDb);
              samplesRef.current = [];
            }}
            className="p-2 rounded-xl border"
            style={{
              backgroundColor: theme.bgSubtle,
              borderColor: theme.borderPrimary,
              color: theme.textSecondary,
            }}
            title={txt.resetTitle}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => (isRunning ? stopMeter() : startMeter())}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white transition-all"
            style={{
              backgroundColor: isRunning ? theme.dangerHex : theme.accentHex,
            }}
          >
            {isRunning ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>{txt.stopBtn}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{txt.startBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          className="p-3.5 rounded-xl border text-xs space-y-1.5"
          style={{
            backgroundColor: `${theme.dangerHex}20`,
            borderColor: theme.dangerHex,
            color: theme.dangerHex,
          }}
        >
          <div className="font-bold">
            {txt.micErr} — {UI_TEXT[lang].micModalErrorTitle}
          </div>
          <div style={{ color: theme.textSecondary }}>
            {UI_TEXT[lang].micModalErrorSteps}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="p-3.5 rounded-xl border"
          style={{
            backgroundColor: theme.bgSubtle,
            borderColor: theme.borderPrimary,
          }}
        >
          <div className="text-xs" style={{ color: theme.textSecondary }}>
            {txt.curLabel}
          </div>
          <div
            className="mt-1 font-mono text-3xl font-extrabold"
            style={{ color: theme.accentHex }}
          >
            {currentSplDb} <span className="text-xs font-normal">dB</span>
          </div>
        </div>
        <div
          className="p-3.5 rounded-xl border"
          style={{
            backgroundColor: theme.bgSubtle,
            borderColor: theme.borderPrimary,
          }}
        >
          <div className="text-xs" style={{ color: theme.textSecondary }}>
            {txt.avgLabel}
          </div>
          <div
            className="mt-1 font-mono text-2xl font-bold"
            style={{ color: theme.secondaryHex }}
          >
            {avgSplDb} <span className="text-xs font-normal">dB</span>
          </div>
        </div>
        <div
          className="p-3.5 rounded-xl border"
          style={{
            backgroundColor: theme.bgSubtle,
            borderColor: theme.borderPrimary,
          }}
        >
          <div className="text-xs" style={{ color: theme.textSecondary }}>
            {txt.minLabel}
          </div>
          <div className="mt-1 font-mono text-2xl font-bold">
            {minSplDb > 80 && !isRunning ? '--' : minSplDb}{' '}
            <span className="text-xs font-normal">dB</span>
          </div>
        </div>
        <div
          className="p-3.5 rounded-xl border"
          style={{
            backgroundColor: theme.bgSubtle,
            borderColor: theme.borderPrimary,
          }}
        >
          <div className="text-xs" style={{ color: theme.textSecondary }}>
            {txt.peakLabel}
          </div>
          <div
            className="mt-1 font-mono text-2xl font-bold"
            style={{ color: theme.warnHex }}
          >
            {peakSplDb} <span className="text-xs font-normal">dB</span>
          </div>
        </div>
      </div>

      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: theme.bgSubtle,
          borderColor: theme.borderPrimary,
        }}
      >
        <div
          className="text-xs mb-2 flex justify-between"
          style={{ color: theme.textSecondary }}
        >
          <span>{txt.specTitle}</span>
          <span className="font-mono text-[11px]">
            {isRunning ? txt.specRunning : txt.specIdle}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={120}
          className="w-full h-28 block"
        />
      </div>

      <div
        className="p-3.5 rounded-xl border flex items-center gap-3 text-xs leading-relaxed"
        style={{
          backgroundColor: isQuietForTuning
            ? `${theme.accentHex}18`
            : isModerateNoise
            ? `${theme.warnHex}18`
            : `${theme.dangerHex}18`,
          borderColor: isQuietForTuning
            ? theme.accentHex
            : isModerateNoise
            ? theme.warnHex
            : theme.dangerHex,
        }}
      >
        {isQuietForTuning ? (
          <CheckCircle2
            className="w-5 h-5 shrink-0"
            style={{ color: theme.accentHex }}
          />
        ) : (
          <ShieldAlert
            className="w-5 h-5 shrink-0"
            style={{ color: theme.warnHex }}
          />
        )}
        <span>
          {isQuietForTuning
            ? txt.quietMsg
            : isModerateNoise
            ? txt.modMsg
            : txt.noisyMsg}
        </span>
      </div>
    </div>
  );
};
