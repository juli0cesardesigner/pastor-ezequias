/**
 * Serviço de Conexão e Gerenciamento BLE para Controle Remoto FEELWORLD TP2A
 */

export const FEELWORLD_PRIMARY_SERVICE = '00001000-e619-419b-bc43-821e71a409b7';

export interface WebBluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<WebBluetoothRemoteGATTServer>;
    disconnect: () => void;
  };
}

export interface WebBluetoothRemoteGATTServer {
  connected: boolean;
  disconnect: () => void;
  getPrimaryService: (service: string) => Promise<WebBluetoothRemoteGATTService>;
}

export interface WebBluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics: () => Promise<WebBluetoothRemoteGATTCharacteristic[]>;
}

export interface WebBluetoothRemoteGATTCharacteristic extends EventTarget {
  uuid: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
  startNotifications: () => Promise<WebBluetoothRemoteGATTCharacteristic>;
  stopNotifications?: () => Promise<WebBluetoothRemoteGATTCharacteristic>;
}

export interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice: (options: {
      filters?: Array<{ name?: string; namePrefix?: string }>;
      optionalServices?: string[];
      acceptAllDevices?: boolean;
    }) => Promise<WebBluetoothDevice>;
    getDevices?: () => Promise<WebBluetoothDevice[]>;
  };
}

export type RemoteActionType =
  | 'PLAY_PAUSE'
  | 'SPEED_UP'
  | 'SPEED_DOWN'
  | 'FONT_UP'
  | 'FONT_DOWN'
  | 'RESTART'
  | 'BACK_TO_EDITOR'
  | 'PREV_LINE'
  | 'NEXT_LINE';

type RemoteActionCallback = (action: RemoteActionType, details?: string) => void;
type RawPacketCallback = (bytes: number[], hex: string, actionLabel: string) => void;
type ConnectionStateCallback = (connected: boolean, deviceName: string | null) => void;

class FeelworldBleService {
  private device: WebBluetoothDevice | null = null;
  private server: WebBluetoothRemoteGATTServer | null = null;
  private isConnecting: boolean = false;
  private autoReconnectActive: boolean = true;
  private reconnectTimer: number | null = null;

  private actionListeners: Set<RemoteActionCallback> = new Set();
  private rawPacketListeners: Set<RawPacketCallback> = new Set();
  private connectionListeners: Set<ConnectionStateCallback> = new Set();

  // Estados anteriores para detecção de borda de subida (keyup -> keydown)
  private prevButtonMask: number = 0; // (b6 << 8) | b7
  private lastJoyDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  private lastJoyTriggerTime: number = 0;

  constructor() {
    // Tentar reconexão automática silenciosa ao inicializar se já houver dispositivo previamente autorizado
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.tryAutoConnectSilently();
      });
      // Reconectar se a aba voltar a ter foco (ex: usuário voltou para o app)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.tryAutoConnectSilently();
        }
      });
    }
  }

  public isConnected(): boolean {
    return !!(this.server && this.server.connected);
  }

  public getDeviceName(): string | null {
    return this.device?.name || null;
  }

  public onAction(cb: RemoteActionCallback): () => void {
    this.actionListeners.add(cb);
    return () => this.actionListeners.delete(cb);
  }

  public onRawPacket(cb: RawPacketCallback): () => void {
    this.rawPacketListeners.add(cb);
    return () => this.rawPacketListeners.delete(cb);
  }

  public onConnectionChange(cb: ConnectionStateCallback): () => void {
    this.connectionListeners.add(cb);
    // Notificar estado atual de imediato
    cb(this.isConnected(), this.getDeviceName());
    return () => this.connectionListeners.delete(cb);
  }

  private notifyConnection(connected: boolean) {
    const name = connected ? this.device?.name || 'FEELWORLD' : null;
    this.connectionListeners.forEach((cb) => cb(connected, name));
  }

  /**
   * Tenta reconectar silenciosamente usando permissões já concedidas pelo usuário (getDevices)
   * Isso roda sem exibir popup nem modal!
   */
  public async tryAutoConnectSilently(): Promise<boolean> {
    if (this.isConnected() || this.isConnecting) return this.isConnected();

    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithBluetooth) : null;
    if (!nav?.bluetooth?.getDevices) return false;

    try {
      const knownDevices = await nav.bluetooth.getDevices();
      if (!knownDevices || knownDevices.length === 0) return false;

      const lastId = typeof localStorage !== 'undefined' ? localStorage.getItem('feelworld_device_id') : null;

      const targetDev =
        (lastId ? knownDevices.find((d) => d.id === lastId) : null) ||
        knownDevices.find((d) => d.name && d.name.toUpperCase().includes('FEELWORLD')) ||
        knownDevices[0]; // Se houver apenas 1 dispositivo previamente permitido no app

      if (targetDev) {
        return await this.setupDevice(targetDev);
      }
    } catch (e) {
      // Falha silenciosa de auto-reconexão
    }
    return false;
  }

  /**
   * Conectar via prompt nativo do usuário (primeira vez)
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected()) return true;
    if (this.isConnecting) return false;

    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithBluetooth) : null;
    if (!nav?.bluetooth) {
      throw new Error('Web Bluetooth API não disponível neste navegador.');
    }

    this.isConnecting = true;
    this.autoReconnectActive = true;

    try {
      const selectedDevice = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: 'FEELWORLD' }],
        optionalServices: [FEELWORLD_PRIMARY_SERVICE],
      });

      return await this.setupDevice(selectedDevice);
    } catch (err) {
      this.disconnect();
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Configuração interna do GATT Server, Characteristics e Watchdog
   */
  private async setupDevice(deviceToConnect: WebBluetoothDevice): Promise<boolean> {
    this.device = deviceToConnect;

    if (typeof localStorage !== 'undefined' && deviceToConnect.id) {
      localStorage.setItem('feelworld_device_id', deviceToConnect.id);
    }

    // Listener para reconexão automática se o controle dormir ou cair
    deviceToConnect.addEventListener('gattserverdisconnected', () => {
      this.server = null;
      this.notifyConnection(false);

      if (this.autoReconnectActive) {
        this.scheduleReconnect();
      }
    });

    const gattServer = await deviceToConnect.gatt?.connect();
    if (!gattServer) {
      throw new Error('Falha ao conectar no GATT Server.');
    }
    this.server = gattServer;

    const primaryService = await gattServer.getPrimaryService(FEELWORLD_PRIMARY_SERVICE);
    const chars = await primaryService.getCharacteristics();

    for (const char of chars) {
      if (char.properties.notify || char.properties.indicate) {
        await char.startNotifications();
        char.addEventListener('characteristicvaluechanged', (ev: Event) => {
          const target = ev.target as unknown as { value?: DataView };
          if (target?.value) {
            this.handleIncomingData(target.value);
          }
        });
      }
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.notifyConnection(true);
    return true;
  }

  /**
   * Watchdog: tenta reatar a conexão a cada 3 segundos quando o controle dorme ou perde sinal
   */
  private scheduleReconnect() {
    if (this.reconnectTimer || !this.autoReconnectActive) return;

    this.reconnectTimer = window.setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.isConnected() && this.device) {
        try {
          await this.setupDevice(this.device);
        } catch {
          // Continua tentando enquanto autoReconnectActive for true
          this.scheduleReconnect();
        }
      }
    }, 2800);
  }

  public disconnect() {
    this.autoReconnectActive = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.server?.connected) {
      try {
        this.server.disconnect();
      } catch {}
    }
    this.device = null;
    this.server = null;
    this.prevButtonMask = 0;
    this.lastJoyDirection = 'NEUTRAL';
    this.notifyConnection(false);
  }

  /**
   * Processamento e mapeamento dos pacotes brutos do FEELWORLD TP2A
   */
  private handleIncomingData(dataView: DataView) {
    const bytes: number[] = [];
    for (let i = 0; i < dataView.byteLength; i++) {
      bytes.push(dataView.getUint8(i));
    }
    const hex = bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    if (bytes.length < 8 || bytes[0] !== 0xA1) {
      return;
    }

    const b2 = bytes[2]; // Joy X (reservado para implementação futura de esquerda/direita)
    const b3 = bytes[3]; // Joy Y
    const b6 = bytes[6]; // Máscara de Botões 1
    const b7 = bytes[7]; // Máscara de Botões 2

    // Manter referência de b2 para futuras expansões sem disparar TS6133
    void b2;

    const currentButtonMask = (b6 << 8) | b7;
    const prevMask = this.prevButtonMask;
    this.prevButtonMask = currentButtonMask;

    let actionLabel = '';

    // ==========================================
    // 1. MAPEAMENTO DOS BOTÕES FÍSICOS DIGITAIS
    // (Apenas no momento do clique / subida)
    // ==========================================
    const isNewPress = currentButtonMask !== 0 && currentButtonMask !== prevMask;

    if (isNewPress) {
      // Play / Pause -> 10 80 (b6 = 0x10, b7 = 0x80)
      if (b6 === 0x10 && b7 === 0x80) {
        actionLabel = 'Play / Pause (OK)';
        this.emitAction('PLAY_PAUSE', actionLabel);
      }
      // Acelerar (+) -> 40 00 (X)
      else if (b6 === 0x40 && b7 === 0x00) {
        actionLabel = 'Acelerar (+) [X]';
        this.emitAction('SPEED_UP', actionLabel);
      }
      // Desacelerar (-) -> 00 02 (B)
      else if (b6 === 0x00 && b7 === 0x02) {
        actionLabel = 'Desacelerar (-) [B]';
        this.emitAction('SPEED_DOWN', actionLabel);
      }
      // Aumentar Fonte -> 80 00 (Y)
      else if (b6 === 0x80 && b7 === 0x00) {
        actionLabel = 'Aumentar Fonte [Y]';
        this.emitAction('FONT_UP', actionLabel);
      }
      // Diminuir Fonte -> 00 08 (A)
      else if (b6 === 0x00 && b7 === 0x08) {
        actionLabel = 'Diminuir Fonte [A]';
        this.emitAction('FONT_DOWN', actionLabel);
      }
      // Reiniciar -> 20 00 (Desliga / Retornar)
      else if (b6 === 0x20 && b7 === 0x00) {
        actionLabel = 'Reiniciar ao Topo';
        this.emitAction('RESTART', actionLabel);
      }
      // Fechar Leitura / Voltar para Editor -> 00 04 (3 Riscos)
      else if (b6 === 0x00 && b7 === 0x04) {
        actionLabel = 'Voltar para Editor (3 Riscos)';
        this.emitAction('BACK_TO_EDITOR', actionLabel);
      }
    }

    // ==========================================
    // 2. MAPEAMENTO DO JOYSTICK (Cima / Baixo)
    // Cima (< 0x40) = Linha Anterior
    // Baixo (> 0xC0) = Próxima Linha
    // ==========================================
    const now = Date.now();
    let joyDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';

    if (b3 < 0x40) {
      joyDirection = 'UP';
    } else if (b3 > 0xC0) {
      joyDirection = 'DOWN';
    }

    // Throttle / Debounce para não disparar 50 linhas em 1 segundo
    if (joyDirection !== 'NEUTRAL') {
      const isInitialPush = this.lastJoyDirection !== joyDirection;
      const timeSinceLast = now - this.lastJoyTriggerTime;

      // Primeiro toque dispara imediato; segurar continuamente dispara a cada 220ms
      if (isInitialPush || timeSinceLast > 220) {
        this.lastJoyTriggerTime = now;
        if (joyDirection === 'UP') {
          actionLabel = 'Linha Anterior (Joystick ⬆️)';
          this.emitAction('PREV_LINE', actionLabel);
        } else {
          actionLabel = 'Próxima Linha (Joystick ⬇️)';
          this.emitAction('NEXT_LINE', actionLabel);
        }
      }
    }

    this.lastJoyDirection = joyDirection;

    // Notificar listeners de depuração/raw packets
    this.rawPacketListeners.forEach((cb) => cb(bytes, hex, actionLabel));
  }

  private emitAction(action: RemoteActionType, details: string) {
    this.actionListeners.forEach((cb) => cb(action, details));
  }
}

export const feelworldBle = new FeelworldBleService();
