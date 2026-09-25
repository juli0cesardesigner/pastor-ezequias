import Peer, { type DataConnection } from 'peerjs';

export type P2PMessageType =
  | 'SYNC_TEXT'
  | 'CONTROL_ACTION'
  | 'SPEED_CHANGE'
  | 'FONT_SIZE_CHANGE'
  | 'FLASH_ALERT'
  | 'STATE_REQUEST'
  | 'STATE_RESPONSE'
  | 'LOAD_SCRIPT';

export interface P2PMessage<T = any> {
  type: P2PMessageType;
  payload: T;
  timestamp: number;
}

export interface PrompterSyncState {
  text: string;
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  textColor?: string;
}

type MessageHandler = (message: P2PMessage) => void;
type StatusChangeHandler = (status: 'disconnected' | 'connecting' | 'connected' | 'error', message?: string) => void;

const PEER_PREFIX = 'ez-ppt-';

/**
 * Gera um código legível de 5 caracteres amigável para humanos (ex: "EZ-742")
 */
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 3; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EZ-${randomPart}`;
}

export function formatRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Gerenciador de conexão P2P (Host ou Cliente Operador)
 */
export class PrompterP2PManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusChangeHandler> = new Set();
  private currentStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private currentRoomCode: string | null = null;
  private isHost: boolean = false;
  private heartbeatInterval: number | null = null;

  public getStatus() {
    return this.currentStatus;
  }

  public getRoomCode() {
    return this.currentRoomCode;
  }

  public getIsConnected() {
    return this.currentStatus === 'connected' && !!this.connection?.open;
  }

  public onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onStatusChange(handler: StatusChangeHandler) {
    this.statusHandlers.add(handler);
    handler(this.currentStatus);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error', msg?: string) {
    this.currentStatus = status;
    this.statusHandlers.forEach((h) => h(status, msg));
  }

  /**
   * Inicia como HOST (Display no Celular montado no Prompter)
   */
  public startHost(existingCode?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = true;
      const roomCode = existingCode ? formatRoomCode(existingCode) : generateRoomCode();
      this.currentRoomCode = roomCode;
      const peerId = `${PEER_PREFIX}${roomCode.toLowerCase()}`;

      this.setStatus('connecting', 'Criando sala segura...');

      try {
        const peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer = peer;

        peer.on('open', () => {
          this.setStatus('disconnected', 'Aguardando conexão do Operador...');
          resolve(roomCode);
        });

        peer.on('connection', (conn) => {
          // Se já havia uma conexão antiga, fecha antes
          if (this.connection) {
            try {
              this.connection.close();
            } catch {
              // ignore
            }
          }
          this.connection = conn;
          this.setupConnectionEvents(conn);
        });

        peer.on('error', (err) => {
          console.warn('P2P Host Peer error:', err);
          // Se o ID já estiver em uso, tenta com outro código aleatório
          if (err.type === 'unavailable-id') {
            const nextCode = generateRoomCode();
            this.currentRoomCode = nextCode;
            this.startHost(nextCode).then(resolve).catch(reject);
            return;
          }
          this.setStatus('error', err.message || 'Erro ao criar sala');
          reject(err);
        });
      } catch (err) {
        this.setStatus('error', 'Falha ao inicializar WebRTC');
        reject(err);
      }
    });
  }

  /**
   * Inicia como OPERADOR (Notebook ou outro dispositivo)
   */
  public connectToHost(roomCodeInput: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = false;
      const cleanCode = formatRoomCode(roomCodeInput);
      this.currentRoomCode = cleanCode;
      const targetPeerId = `${PEER_PREFIX}${cleanCode.toLowerCase()}`;

      this.setStatus('connecting', 'Conectando ao Teleprompter...');

      try {
        const peer = new Peer({
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer = peer;

        peer.on('open', () => {
          const conn = peer.connect(targetPeerId, { reliable: true });
          this.connection = conn;
          this.setupConnectionEvents(conn, resolve, reject);
        });

        peer.on('error', (err) => {
          console.warn('P2P Client Peer error:', err);
          this.setStatus('error', `Não foi possível conectar: ${err.message}`);
          reject(err);
        });
      } catch (err) {
        this.setStatus('error', 'Falha ao inicializar conexão');
        reject(err);
      }
    });
  }

  private setupConnectionEvents(
    conn: DataConnection,
    onSuccess?: () => void,
    onError?: (err: any) => void
  ) {
    let resolved = false;

    conn.on('open', () => {
      resolved = true;
      this.setStatus('connected', 'Conectado em tempo real!');
      this.startHeartbeat();
      if (onSuccess) onSuccess();

      // Se for operador, solicita o estado atual do celular
      if (!this.isHost) {
        this.sendMessage({
          type: 'STATE_REQUEST',
          payload: null,
          timestamp: Date.now(),
        });
      }
    });

    conn.on('data', (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed && typeof parsed.type === 'string') {
          // Ignora mensagens internas de ping/pong
          if (parsed.type === 'PING') {
            this.sendRaw({ type: 'PONG', payload: null, timestamp: Date.now() });
            return;
          }
          if (parsed.type === 'PONG') {
            return;
          }
          this.messageHandlers.forEach((handler) => handler(parsed as P2PMessage));
        }
      } catch (err) {
        console.warn('Erro ao processar mensagem P2P:', err);
      }
    });

    conn.on('close', () => {
      this.stopHeartbeat();
      this.setStatus('disconnected', 'Conexão encerrada');
    });

    conn.on('error', (err) => {
      console.warn('DataConnection error:', err);
      this.stopHeartbeat();
      this.setStatus('error', 'Erro no canal de dados');
      if (!resolved && onError) onError(err);
    });

    // Timeout de segurança se a conexão não abrir em 12s
    setTimeout(() => {
      if (!resolved && !conn.open) {
        this.setStatus('error', 'Tempo limite de conexão esgotado');
        if (onError) onError(new Error('Timeout de conexão'));
      }
    }, 12000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.connection && this.connection.open) {
        this.sendRaw({ type: 'PING', payload: null, timestamp: Date.now() });
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendRaw(data: any): boolean {
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(data);
        return true;
      } catch (err) {
        console.warn('Falha ao enviar dados P2P:', err);
        return false;
      }
    }
    return false;
  }

  public sendMessage(msg: P2PMessage): boolean {
    return this.sendRaw(msg);
  }

  /**
   * Envia texto atualizado
   */
  public sendText(text: string) {
    return this.sendMessage({
      type: 'SYNC_TEXT',
      payload: { text },
      timestamp: Date.now(),
    });
  }

  /**
   * Envia comando de controle (play, pause, restart, countdown)
   */
  public sendControlAction(action: 'play' | 'pause' | 'restart' | 'countdown' | 'step_prev' | 'step_next') {
    return this.sendMessage({
      type: 'CONTROL_ACTION',
      payload: { action },
      timestamp: Date.now(),
    });
  }

  /**
   * Envia alteração de velocidade
   */
  public sendSpeed(speed: number) {
    return this.sendMessage({
      type: 'SPEED_CHANGE',
      payload: { speed },
      timestamp: Date.now(),
    });
  }

  /**
   * Envia alteração de tamanho de fonte
   */
  public sendFontSize(fontSize: number) {
    return this.sendMessage({
      type: 'FONT_SIZE_CHANGE',
      payload: { fontSize },
      timestamp: Date.now(),
    });
  }

  /**
   * Envia aviso relâmpago para a tela do apresentador (ex: "Olhe para a câmera", "Falta 1 minuto")
   */
  public sendFlashAlert(message: string) {
    return this.sendMessage({
      type: 'FLASH_ALERT',
      payload: { message },
      timestamp: Date.now(),
    });
  }

  /**
   * Envia roteiro carregado da nuvem para o prompter
   */
  public sendLoadScript(title: string, content: string) {
    return this.sendMessage({
      type: 'LOAD_SCRIPT',
      payload: { title, content },
      timestamp: Date.now(),
    });
  }

  /**
   * Envia estado completo (resposta a STATE_REQUEST)
   */
  public sendStateResponse(state: PrompterSyncState) {
    return this.sendMessage({
      type: 'STATE_RESPONSE',
      payload: state,
      timestamp: Date.now(),
    });
  }

  /**
   * Encerra conexões e limpa instâncias
   */
  public disconnect() {
    this.stopHeartbeat();
    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // ignore
      }
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
    this.setStatus('disconnected', 'Desconectado');
  }
}

export const p2pManager = new PrompterP2PManager();
