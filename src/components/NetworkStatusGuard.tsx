import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  ShieldAlert, 
  Settings, 
  RefreshCw, 
  X, 
  ExternalLink,
  Info,
  Radio
} from 'lucide-react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { fetchIpAndIspInfo, checkVpnHeuristics } from '../services/networkTester';
import { androidSystem } from '../services/androidSystem';

interface NetworkStatusGuardProps {
  ispName?: string;
  hasConnectedWifi: boolean;
  onRefreshWifiScan: () => void;
  onConnectionStatusChange?: (status: { isWifiConnected: boolean; isCellular: boolean; isVpn: boolean }) => void;
}

export const NetworkStatusGuard: React.FC<NetworkStatusGuardProps> = ({
  ispName: initialIspName,
  hasConnectedWifi: _hasConnectedWifi,
  onRefreshWifiScan,
  onConnectionStatusChange,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionType, setConnectionType] = useState<'wifi' | 'cellular' | 'none' | 'unknown'>('unknown');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    isWifiConnected: boolean;
    isCellular: boolean;
    isVpn: boolean;
  }>({
    isWifiConnected: true,
    isCellular: false,
    isVpn: false,
  });
  
  // Real detected network parameters
  const [netInfo, setNetInfo] = useState<{
    ip: string;
    isp: string;
    org?: string;
    country?: string;
    countryCode?: string;
    isVpn: boolean;
    vpnReason?: string;
  }>({
    ip: '',
    isp: initialIspName || '',
    isVpn: false,
  });

  // Modal helper for opening system Wi-Fi settings on mobile
  const [showWifiSettingsModal, setShowWifiSettingsModal] = useState<boolean>(false);
  const [showVpnSettingsModal, setShowVpnSettingsModal] = useState<boolean>(false);

  // Automatic Real Network & VPN Detection routine
  const checkNetworkStatus = useCallback(async () => {
    setIsChecking(true);

    try {
      // 1. Get real Android Network status via @capacitor/network
      const status: ConnectionStatus = await Network.getStatus();
      const online = Boolean(status.connected || navigator.onLine);
      const type = (status.connectionType || 'unknown') as 'wifi' | 'cellular' | 'none' | 'unknown';
      
      setIsOnline(online);
      setConnectionType(type);

      // 2. Fetch real public IP, ISP and VPN parameters
      const info = await fetchIpAndIspInfo();
      const vpnCheck = checkVpnHeuristics(info);
      const isVpnDetected = Boolean(info.isVpn || vpnCheck.vpnDetected);
      const vpnReason = info.vpnReason || vpnCheck.reason;

      // 3. In-depth Wi-Fi vs Cellular verification:
      // Even if type is 'cellular' (common in Android Chrome with active SIM) or 'unknown',
      // probe if local router gateway or private IP exists
      let wifiConnected = online && (type === 'wifi' || type === 'unknown');
      let isCellularActive = online && type === 'cellular';

      if (!wifiConnected && online) {
        // Probe local router gateways (192.168.1.1, etc.) or WebRTC local IP
        const [localIp, localGw] = await Promise.all([
          androidSystem.getLocalLanIp(),
          androidSystem.probeLocalGateway(),
        ]);
        if (localIp || localGw) {
          wifiConnected = true;
          isCellularActive = false;
        }
      }

      // Check ISP for mobile provider indicators if Wi-Fi isn't explicitly confirmed
      const ispLower = `${info.isp || ''} ${info.org || ''}`.toLowerCase();
      const isKnownMobileIsp = /mts|мтс|megafon|мегафон|beeline|билайн|tele2|теле2|t2|yota|йота|scartel|motiv|мотив/i.test(ispLower);
      if (isKnownMobileIsp && !wifiConnected) {
        isCellularActive = true;
      }

      setNetInfo({
        ip: info.ip,
        isp: info.isp || 'Интернет-провайдер',
        org: info.org,
        country: info.country,
        countryCode: info.countryCode,
        isVpn: isVpnDetected,
        vpnReason,
      });

      const nextStatus = {
        isWifiConnected: wifiConnected,
        isCellular: isCellularActive,
        isVpn: isVpnDetected,
      };

      setConnectionStatus(nextStatus);
      onConnectionStatusChange?.(nextStatus);
    } catch {
      // fallback via browser navigator
      const online = navigator.onLine;
      const navConn = (navigator as any).connection;
      const isCell = navConn?.type === 'cellular';
      setIsOnline(online);
      setConnectionType(isCell ? 'cellular' : (online ? 'wifi' : 'none'));

      const fallbackStatus = {
        isWifiConnected: online,
        isCellular: Boolean(online && isCell),
        isVpn: false,
      };
      setConnectionStatus(fallbackStatus);
      onConnectionStatusChange?.(fallbackStatus);
    } finally {
      setIsChecking(false);
    }
  }, [onConnectionStatusChange]);

  useEffect(() => {
    checkNetworkStatus();

    // Listen to Capacitor native network changes
    const handler = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      setIsOnline(status.connected);
      setConnectionType(status.connectionType as any);
      checkNetworkStatus();
    });

    const handleOnline = () => checkNetworkStatus();
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionType('none');
      const offStatus = {
        isWifiConnected: false,
        isCellular: false,
        isVpn: false,
      };
      setConnectionStatus(offStatus);
      onConnectionStatusChange?.(offStatus);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      handler.then(h => h.remove?.());
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkNetworkStatus, onConnectionStatusChange]);

  // Attempt opening Android settings
  const handleOpenWifiSettings = (e?: React.MouseEvent) => {
    e?.preventDefault();
    androidSystem.openWifiSettings();
    setShowWifiSettingsModal(true);
  };

  const handleOpenVpnSettings = (e?: React.MouseEvent) => {
    e?.preventDefault();
    androidSystem.openVpnSettings();
    setShowVpnSettingsModal(true);
  };

  const handleRefreshAll = () => {
    checkNetworkStatus();
    onRefreshWifiScan();
  };

  const isWifiDisconnected = !connectionStatus.isWifiConnected;
  const isCellularActive = connectionStatus.isCellular;
  const isVpnActive = connectionStatus.isVpn;

  return (
    <div className="space-y-3 w-full">
      
      {/* 🔴 1. УВЕДОМЛЕНИЕ: ВАЙФАЙ ОТКЛЮЧЕН (Отображается на каждой вкладке, если Wi-Fi не подключен) */}
      {isWifiDisconnected && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/50 text-rose-100 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-500/30 text-rose-300 border border-rose-400/50 shrink-0 shadow-lg shadow-rose-500/20">
                <WifiOff className="w-6 h-6 text-rose-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-white tracking-wide uppercase">
                    Внимание: Wi-Fi отключен!
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold uppercase tracking-wider shadow-sm">
                    {isCellularActive ? 'Работает через 4G' : 'Нет сети'}
                  </span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed max-w-2xl font-medium">
                  {isCellularActive 
                    ? 'Устройство использует мобильный интернет оператора. Локальный радиоэфир и роутер клиента недоступны — дашборды пусты.'
                    : 'Устройство находится в офлайн-режиме. Для замера параметров линии и анализа эфира требуется подключение к сети Wi-Fi.'}
                </p>
                <div className="text-[11px] text-rose-300 font-semibold pt-0.5 flex items-center gap-1.5">
                  <span>💡 Смахните шторку Android сверху вниз и нажмите значок Wi-Fi.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
              <button
                onClick={handleOpenWifiSettings}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-all cursor-pointer active:scale-95"
              >
                <Settings className="w-4 h-4" />
                <span>Открыть настройки Wi-Fi</span>
              </button>
              <button
                onClick={handleRefreshAll}
                disabled={isChecking}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-rose-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Повторить проверку сети"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-cyan-400' : 'text-slate-300'}`} />
                <span>Проверить снова</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟠 2. УВЕДОМЛЕНИЕ: ИСПОЛЬЗУЕТСЯ МОБИЛЬНЫЙ ИНТЕРНЕТ (Отображается на каждой вкладке при сотовых данных) */}
      {isCellularActive && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-amber-950/80 border-2 border-amber-400/90 shadow-2xl shadow-amber-950/40 text-amber-100 animate-in fade-in ring-2 ring-amber-400/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0 shadow-lg shadow-amber-500/20 relative">
                <Smartphone className="w-6 h-6 text-amber-300" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-amber-200 tracking-wide uppercase">
                    Используется мобильный интернет (4G / 5G / LTE)
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black uppercase tracking-wider shadow-sm">
                    Сотовая сеть
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl font-medium">
                  Интернет подключен через мобильного оператора ({netInfo.isp || 'Сотовая связь'}). 
                  Локальная сеть Wi-Fi клиента (шлюз 192.168.1.1, спектр каналов, устройства в квартире) недоступны без подключения к домашней сети Wi-Fi.
                </p>
                <div className="text-[11px] text-amber-300 font-semibold pt-0.5">
                  💡 Переключитесь на сеть абонента для выполнения аудита и замера параметров роутера.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
              <button
                onClick={handleOpenWifiSettings}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all cursor-pointer active:scale-95"
              >
                <Wifi className="w-4 h-4" />
                <span>Переключиться на Wi-Fi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟣 3. УВЕДОМЛЕНИЕ: VPN ВКЛЮЧЕН (Отображается на каждой вкладке, если обнаружен туннель/прокси) */}
      {isVpnActive && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-indigo-950/90 via-violet-950/70 to-indigo-950/90 border-2 border-indigo-400/90 shadow-2xl shadow-indigo-950/50 text-indigo-100 animate-in fade-in ring-2 ring-indigo-400/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/50 shrink-0 shadow-lg shadow-indigo-500/20">
                <ShieldAlert className="w-6 h-6 text-indigo-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-white tracking-wide uppercase">
                    Внимание: Включен VPN / Прокси!
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold uppercase tracking-wider shadow-sm">
                    {netInfo.country || 'Зарубежный сервер'} • {netInfo.isp || 'VPN'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl font-medium">
                  {netInfo.vpnReason || 'Весь трафик маршрутизируется через зашифрованный внешний VPN-туннель.'}{' '}
                  Замеры скорости, пинга и проверка DNS сейчас отражают качество сервера VPN, а не домашней линии клиента! Для точного аудита отключите VPN.
                </p>
                {netInfo.ip && (
                  <div className="text-[11px] text-indigo-300 font-mono font-medium">
                    Внешний IP VPN: <span className="font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded border border-indigo-500/40">{netInfo.ip}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
              <button
                onClick={handleOpenVpnSettings}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all cursor-pointer active:scale-95"
              >
                <Settings className="w-4 h-4" />
                <span>Настройки VPN на телефоне</span>
              </button>
              <button
                onClick={handleRefreshAll}
                disabled={isChecking}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Повторить проверку VPN"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-cyan-400' : 'text-slate-300'}`} />
                <span>Проверить снова</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Quick Wi-Fi Settings Guide for Android / Smartphone */}
      {showWifiSettingsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowWifiSettingsModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">
                    Настройки Wi-Fi на смартфоне
                  </h3>
                  <div className="text-xs text-slate-400">
                    Быстрый переход к выбору сети
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowWifiSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Быстрый жест на Android (1 секунда):</span>
              </div>
              <ol className="space-y-2 list-decimal list-inside text-slate-300 pl-1">
                <li>
                  <strong className="text-slate-100">Смахните шторку уведомлений</strong> сверху экрана вниз.
                </li>
                <li>
                  <strong className="text-slate-100">Нажмите и удерживайте</strong> значок <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded font-bold">Wi-Fi</code> (долгий тап откроет список сетей).
                </li>
                <li>
                  <strong className="text-slate-100">Подключитесь</strong> к роутеру клиента.
                </li>
              </ol>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="intent:#Intent;action=android.settings.WIFI_SETTINGS;category=android.intent.category.DEFAULT;end"
                onClick={() => {
                  androidSystem.openWifiSettings();
                }}
                className="w-full py-3 px-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/25 transition-all cursor-pointer select-none active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Открыть настройки Wi-Fi в Android</span>
              </a>

              <a
                href="intent:#Intent;action=android.settings.WIRELESS_SETTINGS;category=android.intent.category.DEFAULT;end"
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none active:scale-95"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>Раздел «Сеть и Интернет»</span>
              </a>

              <button
                onClick={() => {
                  setShowWifiSettingsModal(false);
                  handleRefreshAll();
                }}
                className="w-full py-3 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Я подключил Wi-Fi — обновить статус</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick VPN Settings Guide for Android */}
      {showVpnSettingsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowVpnSettingsModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">
                    Отключение VPN на смартфоне
                  </h3>
                  <div className="text-xs text-slate-400">
                    Для точного тестирования линии клиента
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowVpnSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                Если у вас включен VPN (WireGuard, VLESS, Outline, OpenVPN, WARP и др.), откройте приложение VPN или шторку Android и нажмите <strong className="text-white">«Отключить»</strong>.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="intent:#Intent;action=android.settings.VPN_SETTINGS;category=android.intent.category.DEFAULT;end"
                onClick={() => {
                  androidSystem.openVpnSettings();
                }}
                className="w-full py-3 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer select-none active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Открыть меню VPN Android</span>
              </a>

              <button
                onClick={() => {
                  setShowVpnSettingsModal(false);
                  handleRefreshAll();
                }}
                className="w-full py-3 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>VPN отключен — обновить диагностику</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
