import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

export const DecibelMeterTool: React.FC = () => {
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
        // Map dBFS (-95..0) to estimated ambient SPL (28..105 dB)
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

        // Draw spectrum bars
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
                val > 0.75 ? '#F43F5E' : val > 0.45 ? '#F59E0B' : '#10B981';
              c.fillRect(b * (barW + 2), h - barH, barW, barH);
            }
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : '无法开启麦克风测量环境分贝'
      );
    }
  };

  useEffect(() => {
    return () => stopMeter();
  }, [stopMeter]);

  const isQuietForTuning = currentSplDb <= 52;
  const isModerateNoise = currentSplDb > 52 && currentSplDb <= 68;

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#111722] via-[#0c1018] to-[#090d14] border border-slate-800/90 p-4 sm:p-6 shadow-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            环境噪音分贝仪 & 实时频谱分析 (Acoustic dB & Spectrum Analyzer)
          </h2>
          <p className="text-xs text-slate-400">
            实时评估当前房间的环境底噪是否适合原声乐器拾音调弦，并提供降噪建议
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
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            title="重置统计峰值"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => (isRunning ? stopMeter() : startMeter())}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              isRunning
                ? 'bg-rose-500 text-white'
                : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {isRunning ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>停止检测</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>开始检测环境噪音</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Readout Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">当前声压估算</div>
          <div className="mt-1 font-mono text-3xl font-extrabold text-emerald-400">
            {currentSplDb} <span className="text-xs font-normal">dB</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">平均底噪 (Avg)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-400">
            {avgSplDb} <span className="text-xs font-normal">dB</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">最低安静值 (Min)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-200">
            {minSplDb > 80 && !isRunning ? '--' : minSplDb}{' '}
            <span className="text-xs font-normal">dB</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">瞬态峰值 (Peak)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
            {peakSplDb} <span className="text-xs font-normal">dB</span>
          </div>
        </div>
      </div>

      {/* Spectrum Canvas */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
        <div className="text-xs text-slate-400 mb-2 flex justify-between">
          <span>实时环境声学频谱分布 (20Hz ~ 8000Hz)</span>
          <span className="font-mono text-[11px] text-slate-500">
            {isRunning ? '实时采样中' : '点击上方「开始检测环境噪音」激活'}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={120}
          className="w-full h-28 block"
        />
      </div>

      {/* Suitability Assessment Card */}
      <div
        className={`p-3.5 rounded-xl border flex items-center gap-3 ${
          isQuietForTuning
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : isModerateNoise
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
        }`}
      >
        {isQuietForTuning ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        )}
        <div className="text-xs leading-relaxed">
          {isQuietForTuning ? (
            <span>
              <strong>当前声学环境极佳（≤52 dB）：</strong>
              非常适合进行木吉他、古筝、小提琴等原声乐器的高精度微米级调音。
            </span>
          ) : isModerateNoise ? (
            <span>
              <strong>当前存在一定环境背景音（53~68 dB）：</strong>
              建议在调音器顶部开启<strong>「强效抗噪」</strong>模式，并将手机/麦克风靠近乐器音孔 20~30cm 内。
            </span>
          ) : (
            <span>
              <strong>当前环境非常嘈杂（&gt;68 dB）：</strong>
              强烈建议开启调音器的<strong>「强效抗噪 + 手动锁弦 (Tune Manual)」</strong>，或使用<strong>「Sound It 原声耳调」</strong>功能。
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
