import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  ShieldAlert, 
  Settings, 
  ArrowRight, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Radio
} from 'lucide-react';
import { checkVpnHeuristics } from '../services/networkTester';

interface NetworkStatusGuardProps {
  ispName?: string;
  hasConnectedWifi: boolean;
  onRefreshWifiScan: () => void;
  onConnectionStatusChange?: (status: { isWifiConnected: boolean; isCellular: boolean; isVpn: boolean }) => void;
}

export const NetworkStatusGuard: React.FC<NetworkStatusGuardProps> = ({
  ispName,
  hasConnectedWifi,
  onRefreshWifiScan,
  onConnectionStatusChange,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('wifi');
  const [isSimulatedCellular, setIsSimulatedCellular] = useState<boolean>(false);
  const [isSimulatedWifiOff, setIsSimulatedWifiOff] = useState<boolean>(false);
  const [isSimulatedVpn, setIsSimulatedVpn] = useState<boolean>(false);

  // User dismiss states
  const [mobileDismissed, setMobileDismissed] = useState<boolean>(false);
  const [vpnDismissed, setVpnDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API if available
    const navConn = (navigator as any).connection;
    if (navConn) {
      const updateConn = () => {
        setConnectionType(navConn.type || 'wifi');
      };
      updateConn();
      navConn.addEventListener?.('change', updateConn);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navConn.removeEventListener?.('change', updateConn);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine actual states
  const realWifiConnected = isOnline && hasConnectedWifi && connectionType !== 'cellular' && connectionType !== 'none';
  const effectiveWifiConnected = !isSimulatedWifiOff && !isSimulatedCellular && realWifiConnected;

  const realIsCellular = connectionType === 'cellular';
  const effectiveIsCellular = isSimulatedCellular || (realIsCellular && !effectiveWifiConnected);

  const realVpn = checkVpnHeuristics(ispName).vpnDetected;
  const effectiveVpn = isSimulatedVpn || realVpn;

  // Sync to parent App state
  useEffect(() => {
    onConnectionStatusChange?.({
      isWifiConnected: effectiveWifiConnected,
      isCellular: effectiveIsCellular,
      isVpn: effectiveVpn,
    });
  }, [effectiveWifiConnected, effectiveIsCellular, effectiveVpn, onConnectionStatusChange]);

  const handleOpenWifiSettings = (e: React.MouseEvent) => {
    // Attempt Android system intent for Wi-Fi settings
    try {
      window.location.href = 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end';
    } catch {
      // Fallback
    }
  };

  const handleOpenVpnSettings = (e: React.MouseEvent) => {
    // Attempt Android system intent for VPN settings
    try {
      window.location.href = 'intent:#Intent;action=android.settings.VPN_SETTINGS;end';
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-3">
      
      {/* 1. Wi-Fi NOT CONNECTED BANNER */}
      {!effectiveWifiConnected && !effectiveIsCellular && (
        <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-in fade-in shadow-lg shadow-rose-950/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-rose-200 flex items-center gap-2">
                  <span>Внимание: Wi-Fi не подключен!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold uppercase">
                    Нет связи
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 leading-relaxed max-w-2xl">
                  Для анализа радиоэфира, поиска свободных каналов и открытия настроек роутера 
                  необходимо включить Wi-Fi в настройках Android и подключиться к сети клиента.
                </p>
                <div className="text-[11px] text-rose-400 font-medium pt-0.5">
                  💡 Подсказка: проведите шторку уведомлений Android сверху вниз и включите Wi-Fi.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <a
                href="intent:#Intent;action=android.settings.WIFI_SETTINGS;end"
                onClick={handleOpenWifiSettings}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Открыть настройки Wi-Fi</span>
              </a>
              <button
                onClick={onRefreshWifiScan}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Повторить проверку"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Проверить снова</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CELLULAR (MOBILE INTERNET) BANNER - ILLUMINATED NOTIFICATION */}
      {effectiveIsCellular && (
        <div className={`rounded-2xl p-4 sm:p-5 text-amber-200 transition-all shadow-xl animate-in fade-in ${
          mobileDismissed 
            ? 'bg-amber-950/40 border border-amber-500/40 shadow-amber-950/30' 
            : 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-400/80 ring-2 ring-amber-400/30 shadow-amber-500/20'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="relative p-2.5 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0 shadow-md shadow-amber-500/30">
                <Smartphone className="w-5 h-5 text-amber-300" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-amber-100 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span>Подключен мобильный интернет (4G / 5G / LTE)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-bold border border-amber-400/40 uppercase tracking-wide animate-pulse">
                    Светится уведомление
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
                  Устройство работает через мобильную сеть сотового оператора. Wi-Fi не подключен — 
                  отображение заглушек отключено, дашборды локальной сети пусты. Веб-интерфейс роутера (192.168.1.1) недоступен без Wi-Fi.
                </p>
                <div className="text-[11px] text-amber-300 font-medium">
                  💡 Чтобы наполнить дашборды реальными данными, включите Wi-Fi и подключитесь к домашней сети.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <a
                href="intent:#Intent;action=android.settings.WIFI_SETTINGS;end"
                onClick={handleOpenWifiSettings}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30 transition-all cursor-pointer font-sans"
              >
                <Wifi className="w-4 h-4" />
                <span>Включить Wi-Fi в настройках</span>
              </a>
              {!mobileDismissed && (
                <button
                  onClick={() => setMobileDismissed(true)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-amber-200 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Свернуть</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. VPN DETECTOR BANNER */}
      {effectiveVpn && !vpnDismissed && (
        <div className="rounded-2xl p-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 animate-in fade-in shadow-lg shadow-indigo-950/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-indigo-200 flex items-center gap-2">
                  <span>Обнаружен активный VPN / Прокси</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                    {ispName || 'Датацентр'}
                  </span>
                </div>
                <p className="text-xs text-indigo-300/90 leading-relaxed max-w-2xl">
                  Весь сетевой трафик сейчас маршрутизируется через защищенный VPN-туннель. 
                  Для точной оценки домашней линии абонента, проверки пинга до шлюза и скорости провайдера 
                  рекомендуется временно отключить VPN.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <a
                href="intent:#Intent;action=android.settings.VPN_SETTINGS;end"
                onClick={handleOpenVpnSettings}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Отключить VPN в настройках</span>
              </a>
              <button
                onClick={() => setVpnDismissed(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Скрыть</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technician quick diagnostic bar with simulation toggles */}
      <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">Диагностика среды:</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
              effectiveWifiConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              Wi-Fi: {effectiveWifiConnected ? 'Подключен' : 'Отключен'}
            </span>

            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
              effectiveIsCellular ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
            }`}>
              Сеть: {effectiveIsCellular ? 'Мобильный 4G' : 'Локальная'}
            </span>

            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
              effectiveVpn ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
            }`}>
              VPN: {effectiveVpn ? 'Активен' : 'Отключен'}
            </span>
          </div>
        </div>

        {/* Technician test switches */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-500 hidden md:inline">Тест монтажника:</span>
          <button
            onClick={() => {
              setIsSimulatedWifiOff(prev => !prev);
              setMobileDismissed(false);
            }}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isSimulatedWifiOff
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isSimulatedWifiOff ? '✓ Wi-Fi OFF' : 'Wi-Fi OFF'}
          </button>
          <button
            onClick={() => {
              setIsSimulatedCellular(prev => !prev);
              setMobileDismissed(false);
            }}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isSimulatedCellular
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isSimulatedCellular ? '✓ Мобильный 4G' : '4G LTE'}
          </button>
          <button
            onClick={() => {
              setIsSimulatedVpn(prev => !prev);
              setVpnDismissed(false);
            }}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isSimulatedVpn
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isSimulatedVpn ? '✓ VPN ON' : 'VPN ON'}
          </button>
        </div>
      </div>

    </div>
  );
};
