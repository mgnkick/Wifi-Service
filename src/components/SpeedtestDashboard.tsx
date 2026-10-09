import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Zap, 
  Server, 
  ShieldCheck, 
  AlertCircle,
  Tv,
  Gamepad2,
  Video,
  Download,
  Gauge,
  ExternalLink,
  Globe,
  Smartphone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { SpeedtestResult } from '../types/wifi';
import { SpeedtestRunner, SpeedtestProgress } from '../services/networkTester';

export const SpeedtestDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SpeedtestProgress>({
    phase: 'idle',
    currentSpeedMbps: 0,
    downloadSpeedMbps: 0,
    uploadSpeedMbps: 0,
    pingMs: 0,
    jitterMs: 0,
    progressPercent: 0,
    bufferbloatLatencyMs: 0,
    bufferbloatGrade: 'A',
    historyPoints: [],
  });

  const [result, setResult] = useState<SpeedtestResult | null>(null);
  const [historyResults, setHistoryResults] = useState<SpeedtestResult[]>([]);
  const runnerRef = useRef<SpeedtestRunner | null>(null);

  const startTest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResult(null);

    const runner = new SpeedtestRunner(p => {
      setProgress(p);
    });
    runnerRef.current = runner;

    try {
      const res = await runner.run();
      setResult(res);
      setHistoryResults(prev => [res, ...prev.slice(0, 4)]);
    } catch (err: any) {
      if (err.message !== 'Aborted') {
        setProgress(prev => ({ ...prev, phase: 'error' }));
      }
    } finally {
      setIsRunning(false);
    }
  };

  const stopTest = () => {
    if (runnerRef.current) {
      runnerRef.current.stop();
      setIsRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (runnerRef.current) {
        runnerRef.current.stop();
      }
    };
  }, []);

  // Bufferbloat color
  const getBufferbloatColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (grade === 'B') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (grade === 'C') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  // Suitability ratings based on result
  const dl = result ? result.downloadMbps : progress.downloadSpeedMbps;
  const ping = result ? result.pingMs : progress.pingMs;
  const jitter = result ? result.jitterMs : progress.jitterMs;

  const streamingQuality = dl >= 25 ? 'Идеально (4K/8K HDR)' : dl >= 10 ? 'Хорошо (1080p Full HD)' : 'Базовое (720p)';
  const gamingQuality = ping < 25 && jitter < 5 ? 'Идеально (Киберспорт)' : ping < 50 ? 'Хорошо' : 'Возможны лаги';
  const callsQuality = ping < 60 && jitter < 15 ? 'Четкий звук без задержек' : 'Возможны искажения';

  return (
    <div className="space-y-6">
      
      {/* External Speedtest Quick Action Bar for Technicians */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-slate-700/80 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-100 uppercase tracking-wider">
              Внешние замеры в браузере (для абонента):
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
            Официальные эталонные сервисы
          </span>
        </div>

        {/* 2 Big High-Contrast Touch Buttons for Android */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          
          {/* Yandex Internetometer */}
          <a
            href="https://yandex.ru/internet/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border-2 border-red-500/60 hover:border-red-400 flex items-center justify-between text-xs transition-all group cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                Я
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-red-300 transition-colors flex items-center gap-1.5">
                  <span>Яндекс Интернетометр</span>
                  <ExternalLink className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Замер скорости в браузере, IPv4/IPv6
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-bold text-red-300 bg-red-500/20 rounded-lg shrink-0">
              Открыть ↗
            </span>
          </a>

          {/* 2ip.ru Speedtest */}
          <a
            href="https://2ip.ru/speed/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border-2 border-blue-500/60 hover:border-blue-400 flex items-center justify-between text-xs transition-all group cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 font-mono">
                2ip
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <span>2ip.ru (Замер скорости)</span>
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Независимый замер скорости и пинга
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-bold text-blue-300 bg-blue-500/20 rounded-lg shrink-0">
              Открыть ↗
            </span>
          </a>

        </div>
      </div>

      {/* Top Main Speed Test Stage - Local App Measurement */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect behind meter */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Header / Server Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Локальный экспресс-замер приложения
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Экспресс-тест
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Встроенный быстрый замер пропускной способности, задержки (Ping/Jitter) и буферизации (Bufferbloat).
            </p>
          </div>

          {/* IP / Provider Badge */}
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 font-mono">
            <Server className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="truncate max-w-[200px]">
              {result?.ipInfo?.isp || 'Провайдер определяется...'} ({result?.ipInfo?.ip || 'IP'})
            </div>
          </div>
        </div>

        {/* Central Speed Meter & Start Button */}
        <div className="py-8 flex flex-col items-center justify-center relative z-10">
          
          {/* Gauge Visualization */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Background Arch SVG */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#1e293b"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset="66" // open bottom arch
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#speedGradient)"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset={264 - (198 * Math.min(1, progress.currentSpeedMbps / 200))}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Dashboard Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {!isRunning && !result ? (
                <button
                  onClick={startTest}
                  className="group relative flex flex-col items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30 hover:scale-105 transition-all cursor-pointer"
                >
                  <Play className="w-10 h-10 ml-1 fill-white transition-transform group-hover:scale-110" />
                  <span className="font-bold text-sm tracking-wider uppercase mt-1">СТАРТ</span>
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    {progress.phase === 'ping' && 'Измерение пинга...'}
                    {progress.phase === 'download' && 'Скачивание (Download)...'}
                    {progress.phase === 'bufferbloat' && 'Тест Bufferbloat...'}
                    {progress.phase === 'upload' && 'Отдача (Upload)...'}
                    {progress.phase === 'completed' && 'Тест завершен'}
                  </span>

                  <div className="flex items-baseline font-mono">
                    <span className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight">
                      {progress.phase === 'completed' ? result?.downloadMbps : progress.currentSpeedMbps}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 ml-1">Мбит/с</span>
                  </div>

                  {isRunning && (
                    <button
                      onClick={stopTest}
                      className="mt-3 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-rose-400 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Остановить
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Test Progress Bar */}
          {isRunning && (
            <div className="w-full max-w-md mt-4 space-y-1">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Прогресс</span>
                <span>{progress.progressPercent}%</span>
              </div>
            </div>
          )}

        </div>

        {/* 4 Big Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 pt-4 border-t border-slate-800">
          
          {/* Download */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
              <span>Входящая (Download)</span>
            </div>
            <div className="mt-3 flex items-baseline font-mono">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                {result ? result.downloadMbps : progress.downloadSpeedMbps || '—'}
              </span>
              <span className="text-xs text-slate-400 ml-1">Мбит/с</span>
            </div>
          </div>

          {/* Upload */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ArrowUpCircle className="w-4 h-4 text-blue-400" />
              <span>Исходящая (Upload)</span>
            </div>
            <div className="mt-3 flex items-baseline font-mono">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">
                {result ? result.uploadMbps : progress.uploadSpeedMbps || '—'}
              </span>
              <span className="text-xs text-slate-400 ml-1">Мбит/с</span>
            </div>
          </div>

          {/* Ping & Jitter */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Пинг и Джиттер</span>
            </div>
            <div className="mt-3 flex items-baseline font-mono">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {result ? result.pingMs : progress.pingMs || '—'}
              </span>
              <span className="text-xs text-slate-400 ml-1">мс</span>
              <span className="text-xs text-slate-500 ml-2">
                (±{result ? result.jitterMs : progress.jitterMs || 0})
              </span>
            </div>
          </div>

          {/* Bufferbloat */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bufferbloat (Лаги)</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-lg border font-black text-lg ${getBufferbloatColor(result ? result.bufferbloatGrade : progress.bufferbloatGrade)}`}>
                {result ? result.bufferbloatGrade : progress.bufferbloatGrade}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                +{result ? result.bufferbloatLatencyMs : progress.bufferbloatLatencyMs} мс
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Network Suitability Matrix */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">Видеостриминг (Кинопоиск, YouTube)</div>
              <div className="text-xs text-emerald-400 font-medium mt-0.5">{streamingQuality}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Для 4K UHD требуется стабильно от 25 Мбит/с.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">Онлайн-игры (CS2, Dota, Valorant)</div>
              <div className="text-xs text-emerald-400 font-medium mt-0.5">{gamingQuality}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Пинг {result.pingMs} мс, джиттер {result.jitterMs} мс. Потери: {result.packetLossPct}%.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">Звонки и конференции (Zoom, Telegram)</div>
              <div className="text-xs text-emerald-400 font-medium mt-0.5">{callsQuality}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Исходящий канал {result.uploadMbps} Мбит/с достаточен для HD веб-камеры.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* History of Recent Speedtests */}
      {historyResults.length > 0 && (
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">
              История замеров в текущей сессии
            </h3>
            <button
              onClick={() => setHistoryResults([])}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Очистить
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Время</th>
                  <th className="py-2 px-3">Скачивание</th>
                  <th className="py-2 px-3">Отдача</th>
                  <th className="py-2 px-3">Пинг</th>
                  <th className="py-2 px-3">Bufferbloat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {historyResults.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{r.timestamp}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{r.downloadMbps} Мбит/с</td>
                    <td className="py-2.5 px-3 text-blue-400 font-bold">{r.uploadMbps} Мбит/с</td>
                    <td className="py-2.5 px-3 text-amber-400">{r.pingMs} мс (±{r.jitterMs})</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBufferbloatColor(r.bufferbloatGrade)}`}>
                        {r.bufferbloatGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
