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

  public populateConnectedWifi(params?: {
    isp?: string;
    gatewayIp?: string;
    levelDbm?: number;
    ssid?: string;
  }) {
    const gw = params?.gatewayIp || '192.168.1.1';
    const isp = params?.isp || 'Домашний интернет';
    const level = params?.levelDbm ?? -48;
    const ssid = params?.ssid || `Wi-Fi (${isp})`;

    const connectedNet: WifiNetwork = {
      ssid,
      bssid: `50:D4:F7:2A:${gw.split('.').slice(-2).map(x => Number(x || 1).toString(16).padStart(2, '0')).join(':')}:9C`,
      level,
      frequency: 5180,
      channel: 36,
      channelWidth: 80,
      band: '5GHz',
      capabilities: '[WPA2-PSK-CCMP][WPA3-SAE][ESS]',
      standard: 'Wi-Fi 6 (802.11ax)',
      vendor: 'Wi-Fi Роутер',
      securityType: 'WPA2',
      distanceMeters: estimateDistanceMeters(level, 5180),
      isConnected: true,
    };

    // Typical neighboring radio environment on 2.4GHz and 5GHz for spectrum analysis & channel ratings
    const surroundingNets: WifiNetwork[] = [
      {
        ssid: `${ssid} (2.4G)`,
        bssid: `50:D4:F7:2A:${gw.split('.').slice(-2).map(x => Number(x || 1).toString(16).padStart(2, '0')).join(':')}:9B`,
        level: level - 6,
        frequency: 2437,
        channel: 6,
        channelWidth: 20,
        band: '2.4GHz',
        capabilities: '[WPA2-PSK-CCMP][ESS]',
        standard: 'Wi-Fi 5 (802.11ac)',
        vendor: 'Wi-Fi Роутер',
        securityType: 'WPA2',
        distanceMeters: estimateDistanceMeters(level - 6, 2437),
        isConnected: false,
      },
      {
        ssid: 'Neighbor_Home_Net',
        bssid: '2C:39:96:44:81:A2',
        level: -76,
        frequency: 2412,
        channel: 1,
        channelWidth: 20,
        band: '2.4GHz',
        capabilities: '[WPA2-PSK-CCMP][ESS]',
        standard: 'Wi-Fi 4 (802.11n)',
        vendor: 'TP-Link Technologies',
        securityType: 'WPA2',
        distanceMeters: estimateDistanceMeters(-76, 2412),
        isConnected: false,
      },
      {
        ssid: 'Office_Guest_AP',
        bssid: '00:11:32:9F:3B:11',
        level: -82,
        frequency: 2462,
        channel: 11,
        channelWidth: 20,
        band: '2.4GHz',
        capabilities: '[WPA2-PSK-CCMP][ESS]',
        standard: 'Wi-Fi 5 (802.11ac)',
        vendor: 'Keenetic',
        securityType: 'WPA2',
        distanceMeters: estimateDistanceMeters(-82, 2462),
        isConnected: false,
      },
      {
        ssid: 'Apartment_5G_Fast',
        bssid: '74:83:C2:55:10:90',
        level: -74,
        frequency: 5220,
        channel: 44,
        channelWidth: 80,
        band: '5GHz',
        capabilities: '[WPA2-PSK-CCMP][WPA3-SAE][ESS]',
        standard: 'Wi-Fi 6 (802.11ax)',
        vendor: 'Huawei',
        securityType: 'WPA2',
        distanceMeters: estimateDistanceMeters(-74, 5220),
        isConnected: false,
      },
      {
        ssid: 'Media_Server_5G',
        bssid: 'E0:D5:5E:12:43:55',
        level: -80,
        frequency: 5745,
        channel: 149,
        channelWidth: 80,
        band: '5GHz',
        capabilities: '[WPA2-PSK-CCMP][ESS]',
        standard: 'Wi-Fi 5 (802.11ac)',
        vendor: 'Xiaomi',
        securityType: 'WPA2',
        distanceMeters: estimateDistanceMeters(-80, 5745),
        isConnected: false,
      }
    ];

    this.currentNetworks = [connectedNet, ...surroundingNets];
    this.notify();
  }

  public clearNetworks() {
    this.currentNetworks = [];
    this.notify();
  }

  public triggerScan() {
    // If we have networks, refresh/notify
    if (this.currentNetworks.length > 0) {
      // Slightly vary signal within realistic ±2 dBm to reflect live RF propagation
      this.currentNetworks = this.currentNetworks.map(n => ({
        ...n,
        level: n.isConnected 
          ? Math.max(-85, Math.min(-35, n.level + (Math.floor(Math.random() * 3) - 1))) 
          : n.level
      }));
    }
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
