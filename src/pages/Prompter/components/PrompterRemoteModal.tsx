import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bluetooth,
  BluetoothSearching,
  BluetoothConnected,
  Gamepad,
  Keyboard,
  X,
  Trash2,
  Copy,
  Check,
  Activity,
  Layers,
  HelpCircle,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { feelworldBle, FEELWORLD_PRIMARY_SERVICE } from '../../../services/feelworldBleService';

interface PrompterRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'ble' | 'keyboard' | 'gamepad' | 'system';
  source: string;
  summary: string;
  details: string;
  rawBytes?: number[];
  hexString?: string;
}

export const PrompterRemoteModal: React.FC<PrompterRemoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Estados de conexão BLE
  const [deviceName, setDeviceName] = useState<string | null>(() => feelworldBle.getDeviceName());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(() => feelworldBle.isConnected());
  const [bleError, setBleError] = useState<string | null>(null);

  // Logs em tempo real
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Fallback Gamepad
  const [gamepadsDetected, setGamepadsDetected] = useState<string[]>([]);
  const gamepadPollingRef = useRef<number | null>(null);
  const prevGamepadButtonsRef = useRef<{ [index: number]: boolean[] }>({});
  const prevGamepadAxesRef = useRef<{ [index: number]: number[] }>({});

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Adicionar log auxiliar
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;

    const newLog: LogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 199)]); // Mantém os últimos 200 logs
  }, []);

  // Monitorar conexão e pacotes do singleton feelworldBle
  useEffect(() => {
    const unsubConn = feelworldBle.onConnectionChange((connected, name) => {
      setIsConnected(connected);
      setDeviceName(name);
    });

    const unsubRaw = feelworldBle.onRawPacket((bytes, hex, actionLabel) => {
      addLog({
        type: 'ble',
        source: 'FEELWORLD TP2A',
        summary: actionLabel ? `🎯 ${actionLabel}` : `HEX: [ ${hex} ]`,
        details: `Raw HEX: [ ${hex} ] | Bytes[6,7]: [ ${bytes[6]?.toString(16).toUpperCase() || '00'} ${bytes[7]?.toString(16).toUpperCase() || '00'} ] | Joy: (X:${bytes[2]}, Y:${bytes[3]})`,
        rawBytes: bytes,
        hexString: hex,
      });
    });

    return () => {
      unsubConn();
      unsubRaw();
    };
  }, [addLog]);

  // Conectar Web Bluetooth API
  const handleConnectBle = async () => {
    setIsConnecting(true);
    setBleError(null);
    addLog({
      type: 'system',
      source: 'BLE',
      summary: 'Buscando dispositivos...',
      details: `Filtro namePrefix: 'FEELWORLD', serviço: ${FEELWORLD_PRIMARY_SERVICE}`,
    });

    try {
      await feelworldBle.connect();
      addLog({
        type: 'system',
        source: 'BLE',
        summary: `Conectado com Sucesso!`,
        details: 'Controle FEELWORLD pronto e mapeado para o Teleprompter.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBleError(msg);
      addLog({
        type: 'system',
        source: 'BLE Erro',
        summary: 'Erro na conexão BLE',
        details: msg,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar BLE
  const disconnectBle = () => {
    feelworldBle.disconnect();
    addLog({
      type: 'system',
      source: 'BLE',
      summary: 'Desconectado',
      details: 'Conexão BLE finalizada.',
    });
  };

  // Fallback HID: Ouvir eventos de teclado globais quando o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') return;

      addLog({
        type: 'keyboard',
        source: 'HID / Teclado',
        summary: `Key: "${e.key}" (Code: ${e.code})`,
        details: `keyCode: ${e.keyCode} | which: ${e.which} | Alt: ${e.altKey} | Ctrl: ${e.ctrlKey} | Shift: ${e.shiftKey}`,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, addLog]);

  // Fallback Gamepad: Polling para capturar botões ou eixos caso o controle conecte como joystick
  useEffect(() => {
    if (!isOpen) return;

    const handleGamepadConnected = (e: GamepadEvent) => {
      addLog({
        type: 'gamepad',
        source: 'Gamepad API',
        summary: `Gamepad Conectado: ${e.gamepad.id}`,
        details: `Botões: ${e.gamepad.buttons.length} | Eixos: ${e.gamepad.axes.length}`,
      });
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      addLog({
        type: 'gamepad',
        source: 'Gamepad API',
        summary: `Gamepad Desconectado: ${e.gamepad.id}`,
        details: `Índice: ${e.gamepad.index}`,
      });
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    const pollGamepads = () => {
      if (typeof navigator.getGamepads === 'function') {
        const gamepads = navigator.getGamepads();
        const detectedNames: string[] = [];

        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp) continue;

          detectedNames.push(gp.id);

          const prevButtons = prevGamepadButtonsRef.current[i] || [];
          const currentButtons = gp.buttons.map((b) => b.pressed);

          gp.buttons.forEach((btn, btnIdx) => {
            const wasPressed = prevButtons[btnIdx] || false;
            if (btn.pressed && !wasPressed) {
              addLog({
                type: 'gamepad',
                source: `Gamepad [${i}]`,
                summary: `Botão Pressionado: B${btnIdx}`,
                details: `Valor analógico: ${btn.value.toFixed(2)} | Dispositivo: ${gp.id}`,
              });
            }
          });
          prevGamepadButtonsRef.current[i] = currentButtons;

          const prevAxes = prevGamepadAxesRef.current[i] || [];
          const currentAxes = gp.axes.map((a) => Math.round(a * 10) / 10);

          gp.axes.forEach((axisVal, axisIdx) => {
            const prevVal = prevAxes[axisIdx] || 0;
            if (Math.abs(axisVal) > 0.4 && Math.abs(axisVal - prevVal) > 0.3) {
              addLog({
                type: 'gamepad',
                source: `Gamepad [${i}]`,
                summary: `Eixo Movido: Axis ${axisIdx} -> ${axisVal.toFixed(2)}`,
                details: `Dispositivo: ${gp.id}`,
              });
            }
          });
          prevGamepadAxesRef.current[i] = currentAxes;
        }

        setGamepadsDetected(detectedNames);
      }

      gamepadPollingRef.current = requestAnimationFrame(pollGamepads);
    };

    gamepadPollingRef.current = requestAnimationFrame(pollGamepads);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (gamepadPollingRef.current) {
        cancelAnimationFrame(gamepadPollingRef.current);
      }
    };
  }, [isOpen, addLog]);

  const handleCopyLog = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 1500);
  };

  const handleCopyAllLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.source} -> ${l.summary} | ${l.details}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogId('all');
    setTimeout(() => setCopiedLogId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="prompter-modal-backdrop" onClick={onClose}>
      <div
        className="prompter-modal prompter-remote-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="prompter-modal-header">
          <div className="prompter-remote-header-info">
            <div className="prompter-remote-icon-badge">
              <Bluetooth size={22} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="prompter-modal-title">Controle Remoto Bluetooth</h2>
              <p className="prompter-modal-subtitle">
                FEELWORLD TP2A &amp; Mapeamento Ativo no Teleprompter
              </p>
            </div>
          </div>
          <button
            type="button"
            className="prompter-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Corpo do Modal */}
        <div className="prompter-remote-body">
          {/* Card de Conexão Web Bluetooth */}
          <div className="prompter-remote-section">
            <div className="remote-section-title">
              <Layers size={16} />
              <span>Conexão Web Bluetooth (FEELWORLD BLE)</span>
            </div>

            <div className="remote-ble-connect-bar">
              <div className="remote-ble-device-meta">
                <div className={`ble-status-dot ${isConnected ? 'connected' : isConnecting ? 'connecting' : 'idle'}`} />
                <div>
                  <span className="remote-ble-name">
                    {deviceName || (isConnected ? 'FEELWORLD Conectado' : 'Nenhum dispositivo BLE conectado')}
                  </span>
                  <span className="remote-ble-sub">
                    {isConnected
                      ? 'Controle Remoto ativo e vinculado ao Teleprompter'
                      : 'Filtro: FEELWORLD-* | Modo GAME recomendado'}
                  </span>
                </div>
              </div>

              <div className="remote-ble-actions">
                {isConnected ? (
                  <button
                    type="button"
                    className="remote-btn disconnect-btn"
                    onClick={disconnectBle}
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="remote-btn connect-btn"
                    onClick={handleConnectBle}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <BluetoothSearching size={16} className="animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <BluetoothConnected size={16} />
                        <span>Conectar Controle</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {bleError && (
              <div className="remote-error-box">
                <AlertTriangle size={15} />
                <span>{bleError}</span>
              </div>
            )}
          </div>

          {/* Card de Mapeamento Oficial Configurado */}
          <div className="prompter-remote-section mapping-summary-section">
            <div className="remote-section-title">
              <Sliders size={16} />
              <span>Mapeamento dos Botões Configurado</span>
            </div>

            <div className="remote-mapping-grid">
              <div className="mapping-card-item">
                <span className="mapping-btn-badge highlight">OK [ 10 80 ]</span>
                <span className="mapping-action-name">Play / Pause</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge">X [ 40 00 ]</span>
                <span className="mapping-action-name">Acelerar (+)</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge">B [ 00 02 ]</span>
                <span className="mapping-action-name">Desacelerar (-)</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge">Y [ 80 00 ]</span>
                <span className="mapping-action-name">Aumentar Fonte</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge">A [ 00 08 ]</span>
                <span className="mapping-action-name">Diminuir Fonte</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge">Desliga [ 20 00 ]</span>
                <span className="mapping-action-name">Reiniciar Texto</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge">3 Riscos [ 00 04 ]</span>
                <span className="mapping-action-name">Voltar ao Editor</span>
              </div>
              <div className="mapping-card-item">
                <span className="mapping-btn-badge joy">Joystick ⬆️ ⬇️</span>
                <span className="mapping-action-name">Pular Linhas</span>
              </div>
            </div>
          </div>

          {/* Card de Monitoramento HID / Gamepad */}
          <div className="prompter-remote-section fallback-section">
            <div className="remote-section-title">
              <Keyboard size={16} />
              <span>Fallback HID / Teclado &amp; Gamepad</span>
            </div>
            <div className="fallback-status-bar">
              <div className="fallback-pill active">
                <Keyboard size={14} />
                <span>Listener de Teclas Ativo</span>
              </div>
              <div className={`fallback-pill ${gamepadsDetected.length > 0 ? 'active' : ''}`}>
                <Gamepad size={14} />
                <span>
                  {gamepadsDetected.length > 0
                    ? `Gamepad: ${gamepadsDetected.join(', ')}`
                    : 'Aguardando Gamepad/Joystick...'}
                </span>
              </div>
            </div>
          </div>

          {/* Seção de Logs em Tempo Real */}
          <div className="prompter-remote-section logs-section">
            <div className="remote-section-title between">
              <div className="title-left">
                <Activity size={16} />
                <span>Log em Tempo Real ({logs.length})</span>
              </div>
              <div className="title-actions">
                <button
                  type="button"
                  className="remote-mini-btn"
                  onClick={handleCopyAllLogs}
                  disabled={logs.length === 0}
                  title="Copiar todos os registros para o clipboard"
                >
                  {copiedLogId === 'all' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLogId === 'all' ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  className="remote-mini-btn danger"
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                  title="Limpar logs da tela"
                >
                  <Trash2 size={13} />
                  <span>Limpar</span>
                </button>
              </div>
            </div>

            <div className="remote-logs-console">
              {logs.length === 0 ? (
                <div className="logs-empty-placeholder">
                  <Activity size={32} className="opacity-30 animate-pulse" />
                  <p>Aperte qualquer botão ou mova o joystick do controle.</p>
                  <span>Os comandos acionados serão exibidos aqui em tempo real.</span>
                </div>
              ) : (
                logs.map((entry) => (
                  <div key={entry.id} className={`log-entry-row type-${entry.type}`}>
                    <div className="log-entry-meta">
                      <span className="log-timestamp">{entry.timestamp}</span>
                      <span className={`log-badge badge-${entry.type}`}>{entry.source}</span>
                      <button
                        type="button"
                        className="log-copy-inline"
                        onClick={() =>
                          handleCopyLog(
                            `[${entry.source}] ${entry.summary} | ${entry.details}`,
                            entry.id
                          )
                        }
                        title="Copiar linha"
                      >
                        {copiedLogId === entry.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <div className="log-entry-summary">{entry.summary}</div>
                    <div className="log-entry-details">{entry.details}</div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Dica para o usuário */}
          <div className="prompter-remote-hint">
            <HelpCircle size={15} />
            <span>
              <strong>Dica:</strong> Uma vez conectado, você pode fechar este modal que o controle continua ativo no teleprompter!
            </span>
          </div>

          <div className="remote-modal-footer">
            <button
              type="button"
              className="remote-btn-done"
              onClick={onClose}
            >
              Concluir e Voltar ao Prompter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
