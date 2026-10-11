import { WifiNetwork, RoomMeasurement } from '../types/wifi';
import { estimateDistanceMeters } from '../utils/signalQuality';
import { classifyWifiNetworks } from '../utils/meshDetector';

export class WifiScanService {
  // Factual networks only: starts empty (no mock stubs)
  private currentNetworks: WifiNetwork[] = [];
  private subscribers: ((networks: WifiNetwork[]) => void)[] = [];
  private roomMeasurements: RoomMeasurement[] = [];

  constructor() {
    this.currentNetworks = [];
  }

  public getNetworks(): WifiNetwork[] {
    return classifyWifiNetworks(this.currentNetworks);
  }

  public getConnectedNetwork(): WifiNetwork | undefined {
    return this.currentNetworks.find(n => n.isConnected);
  }

  public setNetworks(networks: WifiNetwork[]) {
    this.currentNetworks = networks;
    this.notify();
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
    // Notify current state
    this.notify();
  }

  public addCustomNetwork(network: Partial<WifiNetwork>): WifiNetwork {
    const freq = network.band === '2.4GHz' 
      ? 2412 + ((network.channel || 1) - 1) * 5 
      : 5000 + (network.channel || 36) * 5;

    const newNet: WifiNetwork = {
      ssid: network.ssid || 'Wi-Fi_Network',
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

  public destroy() {
    this.subscribers = [];
  }
}

export const wifiScanner = new WifiScanService();
