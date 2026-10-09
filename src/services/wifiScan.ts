import { WifiNetwork, ScenarioPreset, RoomMeasurement } from '../types/wifi';
import { MOCK_SCENARIOS } from '../data/mockScenarios';
import { estimateDistanceMeters } from '../utils/signalQuality';
import { classifyWifiNetworks } from '../utils/meshDetector';

export class WifiScanService {
  private currentScenario: ScenarioPreset;
  private currentNetworks: WifiNetwork[];
  private fluctuationTimer: number | null = null;
  private subscribers: ((networks: WifiNetwork[]) => void)[] = [];
  private roomMeasurements: RoomMeasurement[] = [];

  constructor() {
    this.currentScenario = MOCK_SCENARIOS[0];
    this.currentNetworks = JSON.parse(JSON.stringify(this.currentScenario.networks));
    this.startFluctuations();
  }

  public getScenarios(): ScenarioPreset[] {
    return MOCK_SCENARIOS;
  }

  public getCurrentScenario(): ScenarioPreset {
    return this.currentScenario;
  }

  public setScenario(id: string) {
    const found = MOCK_SCENARIOS.find(s => s.id === id);
    if (found) {
      this.currentScenario = found;
      this.currentNetworks = JSON.parse(JSON.stringify(found.networks));
      this.notify();
    }
  }

  public getNetworks(): WifiNetwork[] {
    return classifyWifiNetworks(this.currentNetworks);
  }

  public getConnectedNetwork(): WifiNetwork | undefined {
    return this.currentNetworks.find(n => n.isConnected);
  }

  public subscribe(cb: (networks: WifiNetwork[]) => void): () => void {
    this.subscribers.push(cb);
    cb(this.getNetworks());
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notify() {
    const data = this.getNetworks();
    this.subscribers.forEach(cb => cb(data));
  }

  public triggerScan() {
    this.notify();
  }

  /**
   * Add a custom network (user can simulate adding their own router or neighbor)
   */
  public addCustomNetwork(network: Partial<WifiNetwork>): WifiNetwork {
    const freq = network.band === '2.4GHz' 
      ? 2412 + ((network.channel || 1) - 1) * 5 
      : 5000 + (network.channel || 36) * 5;

    const newNet: WifiNetwork = {
      ssid: network.ssid || 'New_Router',
      bssid: network.bssid || `02:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:11:22:33`,
      level: network.level || -55,
      frequency: freq,
      channel: network.channel || 6,
      channelWidth: network.channelWidth || (network.band === '5GHz' ? 80 : 20),
      band: network.band || '2.4GHz',
      capabilities: '[WPA2-PSK-CCMP][ESS]',
      standard: network.standard || 'Wi-Fi 5 (802.11ac)',
      vendor: network.vendor || 'Роутер',
      securityType: network.securityType || 'WPA2',
      distanceMeters: estimateDistanceMeters(network.level || -55, freq),
      isConnected: false,
    };

    this.currentNetworks.unshift(newNet);
    this.notify();
    return newNet;
  }

  /**
   * Set signal level for connected network (e.g. for walk test)
   */
  public setConnectedLevel(dbm: number) {
    const connected = this.currentNetworks.find(n => n.isConnected);
    if (connected) {
      connected.level = Math.max(-95, Math.min(-25, dbm));
      connected.distanceMeters = estimateDistanceMeters(connected.level, connected.frequency);
      this.notify();
    }
  }

  /**
   * Record room measurement for coverage survey
   */
  public recordRoomMeasurement(roomName: string, signalDbm: number, speedMbps?: number): RoomMeasurement {
    let quality: RoomMeasurement['quality'] = 'Отличный';
    if (signalDbm < -85) quality = 'Мертвая зона';
    else if (signalDbm < -75) quality = 'Слабый';
    else if (signalDbm < -67) quality = 'Средний';
    else if (signalDbm < -55) quality = 'Хороший';

    const measurement: RoomMeasurement = {
      id: `room_${Date.now()}`,
      roomName,
      signalDbm,
      speedMbps,
      quality,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    this.roomMeasurements.push(measurement);
    return measurement;
  }

  public getRoomMeasurements(): RoomMeasurement[] {
    return [...this.roomMeasurements];
  }

  public clearRoomMeasurements() {
    this.roomMeasurements = [];
  }

  /**
   * Real natural radio fluctuation (±1-3 dBm multipath fading)
   */
  private startFluctuations() {
    if (this.fluctuationTimer) return;
    this.fluctuationTimer = window.setInterval(() => {
      this.currentNetworks = this.currentNetworks.map(n => {
        // Small realistic jitter in RSSI
        const jitter = (Math.random() - 0.5) * 2;
        const newLevel = Math.max(-95, Math.min(-28, Math.round(n.level + jitter)));
        return {
          ...n,
          level: newLevel,
          distanceMeters: estimateDistanceMeters(newLevel, n.frequency),
        };
      });
      this.notify();
    }, 2500);
  }

  public destroy() {
    if (this.fluctuationTimer) {
      clearInterval(this.fluctuationTimer);
      this.fluctuationTimer = null;
    }
    this.subscribers = [];
  }
}

export const wifiScanner = new WifiScanService();
