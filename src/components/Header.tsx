import React from 'react';
import { 
  Wifi, 
  WifiOff,
  Network,
  Activity, 
  Lightbulb, 
  BookOpen, 
  FileText, 
  Sun, 
  Moon, 
  Heart,
  Smartphone,
  Router,
  Wrench
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab = 'analyzer' | 'scanner' | 'speedtest' | 'recommendations' | 'report' | 'knowledge';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDonate: () => void;
  onOpenApkModal: () => void;
  onOpenRouterWeb: () => void;
  connectedSsid?: string;
  connectedSignalDbm?: number;
  isWifiConnected?: boolean;
  isCellular?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDonate,
  onOpenApkModal,
  onOpenRouterWeb,
  connectedSsid,
  connectedSignalDbm,
  isWifiConnected = true,
  isCellular = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const navItems: { id: ActiveTab; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
    { id: 'analyzer', label: 'Анализатор', mobileLabel: 'Эфир', icon: <Wifi className="w-4 h-4" /> },
    { id: 'scanner', label: 'Сканер сети', mobileLabel: 'Сканер', icon: <Network className="w-4 h-4" /> },
    { id: 'speedtest', label: 'Спидтест', mobileLabel: 'Скорость', icon: <Activity className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Советы', mobileLabel: 'Аудит', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'report', label: 'Отчёт для ТП', mobileLabel: 'Отчёт', icon: <FileText className="w-4 h-4" /> },
    { id: 'knowledge', label: 'База знаний', mobileLabel: 'Справка', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Logo & Technician Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white shadow-md ${
                !isWifiConnected 
                  ? (isCellular ? 'bg-amber-600 shadow-amber-600/30' : 'bg-slate-800 shadow-slate-900')
                  : 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/25'
              }`}>
                {!isWifiConnected ? (
                  isCellular ? <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 text-rose-300" />
                ) : (
                  <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-slate-900 rounded-full ${
                  !isWifiConnected 
                    ? (isCellular ? 'bg-amber-400 animate-ping' : 'bg-rose-500')
                    : 'bg-emerald-400'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                    WiFi Expert
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                    <Wrench className="w-2.5 h-2.5" />
                    <span>Сервис</span>
                  </span>
                </div>
                <div className="text-[11px] truncate max-w-[150px] sm:max-w-[240px]">
                  {!isWifiConnected ? (
                    isCellular ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Мобильный 4G/LTE</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium">Wi-Fi отключен</span>
                    )
                  ) : (
                    <span className="text-slate-400 font-mono truncate">
                      {connectedSsid ? `${connectedSsid} (${connectedSignalDbm || -50} dBm)` : 'Сеть подключена'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Nav Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Dedicated "Роутер" button (Opens Router Web Interface) */}
              <button
                onClick={onOpenRouterWeb}
                title="Открыть веб-интерфейс роутера (шлюз 192.168.1.1)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 hover:text-indigo-200 transition-all cursor-pointer whitespace-nowrap"
              >
                <Router className="w-4 h-4 text-indigo-400" />
                <span>Роутер (Web UI)</span>
              </button>
            </nav>

            {/* Right Tools: Donate, APK, Theme (Scenario dropdown removed) */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Cellular Indicator Badge if active */}
              {isCellular && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold animate-pulse shadow-sm shadow-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400 animate-ping" />
                  <span>4G</span>
                </div>
              )}

              {/* Donate Button (Sber Card) */}
              <button
                onClick={onOpenDonate}
                title="Поддержать проект (карта Сбера РФ)"
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span className="text-[11px] font-bold">Донат</span>
              </button>

              {/* Android APK Modal Trigger */}
              <button
                onClick={onOpenApkModal}
                title="Android APK / Сборка для смартфона"
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">APK</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
                className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Переключить тему"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar (Android Phone Thumb Navigation) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe shadow-2xl px-0.5 py-1 flex items-center justify-between">
        {navItems.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                active
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-cyan-500/15 scale-105' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight leading-none text-center truncate max-w-full">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}

        {/* Mobile Router Web Button (Direct Gateway 192.168.1.1) */}
        <button
          onClick={onOpenRouterWeb}
          className="flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer text-indigo-400 hover:text-indigo-300 active:scale-95"
          title="Открыть веб-интерфейс роутера (шлюз 192.168.1.1)"
        >
          <div className="p-1 rounded-lg bg-indigo-500/15">
            <Router className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight leading-none font-semibold text-center truncate max-w-full">
            Роутер
          </span>
        </button>
      </nav>
    </>
  );
};
