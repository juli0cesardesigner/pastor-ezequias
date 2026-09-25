import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Wifi,
  Cloud,
  Save,
  Send,
  Bell,
  ArrowLeft,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  Timer,
  Type,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  p2pManager,
  formatRoomCode,
  type P2PMessage,
  type PrompterSyncState,
} from '../../../services/prompterP2PService';
import {
  fetchCloudScripts,
  saveCloudScript,
  type CloudScript,
} from '../../../services/prompterService';

interface PrompterOperatorDeckProps {
  initialRoomCode?: string;
  onExitOperatorMode: () => void;
}

export const PrompterOperatorDeck: React.FC<PrompterOperatorDeckProps> = ({
  initialRoomCode = '',
  onExitOperatorMode,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected'
  );
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Estados sincronizados com o teleprompter
  const [text, setText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(28);
  const [fontSize, setFontSize] = useState<number>(52);

  // Mensagem rápida (Flash alert)
  const [flashInput, setFlashInput] = useState<string>('');
  const [flashFeedback, setFlashFeedback] = useState<string | null>(null);

  // Scripts na Nuvem (Neon DB)
  const [cloudScripts, setCloudScripts] = useState<CloudScript[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [showCloudSelector, setShowCloudSelector] = useState<boolean>(false);
  const [selectedCloudScript, setSelectedCloudScript] = useState<CloudScript | null>(null);
  const [saveTitleInput, setSaveTitleInput] = useState<string>('');

  const textDebounceRef = useRef<number | null>(null);

  // Conectar ao iniciar se houver initialRoomCode
  useEffect(() => {
    const unsubStatus = p2pManager.onStatusChange((status, msg) => {
      setConnectionStatus(status);
      if (msg) setStatusMessage(msg);
    });

    const unsubMsg = p2pManager.onMessage((msg: P2PMessage) => {
      switch (msg.type) {
        case 'STATE_RESPONSE': {
          const s = msg.payload as PrompterSyncState;
          if (s.text !== undefined) setText(s.text);
          if (s.isPlaying !== undefined) setIsPlaying(s.isPlaying);
          if (s.speed !== undefined) setSpeed(s.speed);
          if (s.fontSize !== undefined) setFontSize(s.fontSize);
          break;
        }
        case 'CONTROL_ACTION': {
          const action = msg.payload?.action;
          if (action === 'play') setIsPlaying(true);
          if (action === 'pause') setIsPlaying(false);
          break;
        }
        case 'SPEED_CHANGE': {
          if (typeof msg.payload?.speed === 'number') {
            setSpeed(msg.payload.speed);
          }
          break;
        }
        case 'SYNC_TEXT': {
          if (typeof msg.payload?.text === 'string') {
            setText(msg.payload.text);
          }
          break;
        }
        case 'LOAD_SCRIPT': {
          if (typeof msg.payload?.content === 'string') {
            setText(msg.payload.content);
          }
          break;
        }
      }
    });

    if (initialRoomCode.trim()) {
      handleConnect(initialRoomCode);
    }

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [initialRoomCode]);

  // Carregar roteiros da nuvem Neon
  const loadCloudScripts = useCallback(async () => {
    setIsLoadingCloud(true);
    try {
      const data = await fetchCloudScripts();
      setCloudScripts(data);
    } catch (err) {
      console.error('Erro ao buscar roteiros no Neon:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  }, []);

  useEffect(() => {
    loadCloudScripts();
  }, [loadCloudScripts]);

  const handleConnect = async (codeToConnect?: string) => {
    const code = codeToConnect || roomCodeInput;
    if (!code.trim()) return;

    try {
      await p2pManager.connectToHost(code);
    } catch (err) {
      console.error('Falha ao conectar via P2P:', err);
    }
  };

  // Enviar texto com micro-debounce para digitação fluida
  const handleTextChange = (newText: string) => {
    setText(newText);
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
    }
    textDebounceRef.current = window.setTimeout(() => {
      p2pManager.sendText(newText);
    }, 60);
  };

  // Play / Pause remoto
  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    p2pManager.sendControlAction(next ? 'play' : 'pause');
  };

  // Reiniciar ao topo
  const handleRestart = () => {
    p2pManager.sendControlAction('restart');
  };

  // Disparar contagem regressiva
  const handleCountdown = () => {
    p2pManager.sendControlAction('countdown');
  };

  // Ajustar velocidade remota
  const handleSpeedChange = (newSpeed: number) => {
    const clamped = Math.max(1, Math.min(100, newSpeed));
    setSpeed(clamped);
    p2pManager.sendSpeed(clamped);
  };

  // Ajustar tamanho de fonte remoto
  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(20, Math.min(110, newSize));
    setFontSize(clamped);
    p2pManager.sendFontSize(clamped);
  };

  // Enviar recado rápido para o apresentador
  const handleSendFlash = (msgToSend?: string) => {
    const finalMsg = msgToSend || flashInput;
    if (!finalMsg.trim()) return;
    p2pManager.sendFlashAlert(finalMsg.trim());
    setFlashFeedback(`Aviso enviado: "${finalMsg.trim()}"`);
    setFlashInput('');
    setTimeout(() => setFlashFeedback(null), 3000);
  };

  // Carregar roteiro selecionado da nuvem para o celular
  const handleLoadCloudScriptToPrompter = (script: CloudScript) => {
    setSelectedCloudScript(script);
    setText(script.content);
    setSaveTitleInput(script.title);
    p2pManager.sendLoadScript(script.title, script.content);
    setShowCloudSelector(false);
    setCloudMessage(`Roteiro "${script.title}" enviado ao celular!`);
    setTimeout(() => setCloudMessage(null), 3500);
  };

  // Salvar roteiro editado na nuvem Neon
  const handleSaveToCloud = async () => {
    if (!text.trim()) return;
    const title = saveTitleInput.trim() || selectedCloudScript?.title || 'Roteiro Operador';

    setIsSavingCloud(true);
    try {
      const saved = await saveCloudScript({
        id: selectedCloudScript?.id ?? null,
        title,
        content: text,
        category: selectedCloudScript?.category || 'Geral',
      });
      setSelectedCloudScript(saved);
      setCloudMessage(`Salvo na nuvem com sucesso: "${saved.title}"`);
      await loadCloudScripts();
      setTimeout(() => setCloudMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar no Neon:', err);
      setCloudMessage('Erro ao salvar no banco de dados.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Estatísticas de palavras e tempo
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { words: 0, chars: 0, time: '~0s' };
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const chars = trimmed.length;
    const wpm = Math.max(60, Math.round(80 + speed * 1.8));
    const totalSeconds = Math.round((words / wpm) * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const time = mins === 0 ? `~${secs}s` : secs === 0 ? `~${mins}m` : `~${mins}m ${secs}s`;
    return { words, chars, time };
  }, [text, speed]);

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="prompter-operator-deck">
      {/* BARRA SUPERIOR DE CONEXÃO E NAVEGAÇÃO */}
      <header className="operator-header">
        <div className="operator-header-left">
          <button
            type="button"
            className="operator-back-btn"
            onClick={onExitOperatorMode}
            title="Voltar ao modo normal do Teleprompter"
          >
            <ArrowLeft size={18} />
            <span>Sair do Modo Operador</span>
          </button>
          <div className="operator-title-group">
            <span className="operator-badge">Deck do Operador</span>
            <h1>Controle Remoto e Edição Simultânea</h1>
          </div>
        </div>

        <div className="operator-header-right">
          {/* Card de Pareamento */}
          <div className={`operator-conn-card ${isConnected ? 'is-connected' : 'is-disconnected'}`}>
            <Wifi size={18} className={isConnected ? 'text-emerald-400' : 'text-amber-400'} />
            {isConnected ? (
              <div className="operator-conn-info">
                <span className="conn-title">Conectado ao Celular</span>
                <span className="conn-room">Sala: <strong>{p2pManager.getRoomCode()}</strong></span>
              </div>
            ) : (
              <div className="operator-conn-form">
                <input
                  type="text"
                  placeholder="Código (ex: EZ-742)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(formatRoomCode(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  className="operator-code-input"
                  maxLength={10}
                />
                <button
                  type="button"
                  className="operator-connect-btn"
                  onClick={() => handleConnect()}
                  disabled={connectionStatus === 'connecting' || !roomCodeInput.trim()}
                >
                  {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FEEDBACKS E ALERTAS */}
      {statusMessage && !isConnected && (
        <div className="operator-status-banner">
          <AlertCircle size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {cloudMessage && (
        <div className="operator-cloud-toast">
          <Check size={16} />
          <span>{cloudMessage}</span>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL: DIVIDIDO EM EDITOR E PAINEL DE CONTROLE */}
      <div className="operator-grid-layout">
        {/* COLUNA ESQUERDA: EDITOR EM TEMPO REAL */}
        <div className="operator-editor-panel">
          <div className="operator-panel-top">
            <div className="operator-stats-pills">
              <span className="operator-pill">
                <strong>{stats.words}</strong> palavras
              </span>
              <span className="operator-pill">
                <strong>{stats.chars}</strong> caracteres
              </span>
              <span className="operator-pill highlight">
                <Clock size={14} /> Tempo estimado: <strong>{stats.time}</strong>
              </span>
            </div>

            <div className="operator-editor-actions">
              <button
                type="button"
                className="operator-secondary-btn"
                onClick={() => setShowCloudSelector(true)}
              >
                <Cloud size={16} />
                <span>Carregar da Nuvem</span>
              </button>
              <button
                type="button"
                className="operator-primary-btn"
                onClick={handleSaveToCloud}
                disabled={isSavingCloud || !text.trim()}
              >
                <Save size={16} />
                <span>{isSavingCloud ? 'Salvando...' : 'Salvar no Neon'}</span>
              </button>
            </div>
          </div>

          <div className="operator-textarea-wrapper">
            <textarea
              className="operator-main-textarea"
              placeholder="Digite ou cole aqui o texto. Cada caractere digitado atualiza a tela do celular do teleprompter imediatamente..."
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
            />
            {!isConnected && (
              <div className="operator-offline-hint">
                <Wifi size={16} className="text-amber-400" />
                <span>Modo offline: Conecte-se ao celular no topo para transmitir em tempo real.</span>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: CONSOLE DE GRAVAÇÃO (PLAY/PAUSE, VELOCIDADE, RECADOS) */}
        <div className="operator-control-panel">
          {/* SEÇÃO 1: REPRODUÇÃO PRINCIPAL */}
          <div className="operator-section-card">
            <h3 className="operator-section-title">Controle de Rolagem Remota</h3>

            <div className="operator-main-controls">
              <button
                type="button"
                className={`operator-play-btn ${isPlaying ? 'is-playing' : ''}`}
                onClick={handleTogglePlay}
                title={isPlaying ? 'Pausar rolagem no celular' : 'Iniciar rolagem no celular'}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
                <span>{isPlaying ? 'PAUSAR' : 'INICIAR ROLAGEM'}</span>
              </button>

              <div className="operator-sub-controls">
                <button
                  type="button"
                  className="operator-action-subbtn"
                  onClick={handleRestart}
                  title="Voltar ao início do roteiro"
                >
                  <RotateCcw size={18} />
                  <span>Reiniciar ao Topo</span>
                </button>

                <button
                  type="button"
                  className="operator-action-subbtn"
                  onClick={handleCountdown}
                  title="Disparar contagem de 3 segundos na tela"
                >
                  <Timer size={18} />
                  <span>Contagem (3s)</span>
                </button>

                <button
                  type="button"
                  className="operator-action-subbtn"
                  onClick={() => p2pManager.sendControlAction('step_prev')}
                  title="Recuar 1 linha na roleta do celular"
                >
                  <ChevronUp size={18} />
                  <span>Linha Anterior</span>
                </button>

                <button
                  type="button"
                  className="operator-action-subbtn"
                  onClick={() => p2pManager.sendControlAction('step_next')}
                  title="Avançar 1 linha na roleta do celular"
                >
                  <ChevronDown size={18} />
                  <span>Próxima Linha</span>
                </button>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: AJUSTE FINO DE VELOCIDADE */}
          <div className="operator-section-card">
            <div className="operator-speed-header">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-amber-400" />
                <h3 className="operator-section-title" style={{ margin: 0 }}>Velocidade do Prompter</h3>
              </div>
              <span className="operator-speed-value">{speed}</span>
            </div>

            <div className="operator-speed-slider-row">
              <button
                type="button"
                className="operator-speed-step-btn"
                onClick={() => handleSpeedChange(speed - 1)}
                title="Diminuir velocidade (-1)"
              >
                -1
              </button>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={speed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="operator-speed-slider"
              />
              <button
                type="button"
                className="operator-speed-step-btn"
                onClick={() => handleSpeedChange(speed + 1)}
                title="Aumentar velocidade (+1)"
              >
                +1
              </button>
            </div>
            <div className="operator-speed-presets">
              <button type="button" onClick={() => handleSpeedChange(18)}>Lenta (18)</button>
              <button type="button" onClick={() => handleSpeedChange(28)}>Padrão (28)</button>
              <button type="button" onClick={() => handleSpeedChange(40)}>Rápida (40)</button>
              <button type="button" onClick={() => handleSpeedChange(55)}>Locução (55)</button>
            </div>

            {/* Ajuste de Fonte Remoto */}
            <div className="operator-speed-header" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #27272a' }}>
              <div className="flex items-center gap-2">
                <Type size={18} className="text-amber-400" />
                <h3 className="operator-section-title" style={{ margin: 0 }}>Tamanho da Fonte</h3>
              </div>
              <span className="operator-speed-value">{fontSize}px</span>
            </div>

            <div className="operator-speed-slider-row">
              <button
                type="button"
                className="operator-speed-step-btn"
                onClick={() => handleFontSizeChange(fontSize - 1)}
                title="Diminuir fonte (-1px)"
              >
                -1
              </button>
              <input
                type="range"
                min={20}
                max={110}
                step={1}
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="operator-speed-slider"
              />
              <button
                type="button"
                className="operator-speed-step-btn"
                onClick={() => handleFontSizeChange(fontSize + 1)}
                title="Aumentar fonte (+1px)"
              >
                +1
              </button>
            </div>
          </div>

          {/* SEÇÃO 3: RECADOS RELÂMPAGO NA TELA (FLASH ALERTS) */}
          <div className="operator-section-card">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={18} className="text-cyan-400" />
              <h3 className="operator-section-title" style={{ margin: 0 }}>Recado na Tela da Câmera</h3>
            </div>
            <p className="operator-section-desc">
              Exibe um aviso rápido no topo do prompter para o apresentador sem parar a rolagem.
            </p>

            <div className="operator-flash-form">
              <input
                type="text"
                placeholder="Ex: Olhe para a câmera 2..."
                value={flashInput}
                onChange={(e) => setFlashInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendFlash()}
                className="operator-flash-input"
              />
              <button
                type="button"
                className="operator-flash-send-btn"
                onClick={() => handleSendFlash()}
                disabled={!flashInput.trim()}
              >
                <Send size={16} />
              </button>
            </div>

            <div className="operator-flash-quick-tags">
              <button type="button" onClick={() => handleSendFlash('Olhe para a câmera')}>
                👁️ Olhe para a câmera
              </button>
              <button type="button" onClick={() => handleSendFlash('Falta 1 minuto')}>
                ⏱️ Falta 1 min
              </button>
              <button type="button" onClick={() => handleSendFlash('Fale com mais calma')}>
                🧘 Mais calma
              </button>
              <button type="button" onClick={() => handleSendFlash('Sorria!')}>
                😊 Sorria
              </button>
            </div>

            {flashFeedback && (
              <div className="operator-flash-sent-feedback">
                <Check size={14} />
                <span>{flashFeedback}</span>
              </div>
            )}
          </div>

          {/* SEÇÃO 4: GARANTIA NEON DB */}
          <div className="operator-safety-note">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <div>
              <strong>Segurança Neon DB Ativa</strong>
              <p>Os roteiros salvos no banco de dados estão protegidos. Carregue ou salve sem afetar outros dados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE ROTEIROS DA NUVEM NEON */}
      {showCloudSelector && (
        <div className="prompter-modal-backdrop" onClick={() => setShowCloudSelector(false)}>
          <div className="prompter-cloud-modal" onClick={(e) => e.stopPropagation()}>
            <header className="prompter-cloud-header">
              <div>
                <h2>Carregar Roteiro do Neon para o Celular</h2>
                <p>Selecione um roteiro salvo na nuvem para transmitir imediatamente ao teleprompter</p>
              </div>
              <button
                type="button"
                className="prompter-modal-close-btn"
                onClick={() => setShowCloudSelector(false)}
              >
                &times;
              </button>
            </header>

            <div className="prompter-cloud-list">
              {isLoadingCloud ? (
                <div className="prompter-loading-state">
                  <div className="prompter-spinner" />
                  <span>Buscando roteiros no Neon DB...</span>
                </div>
              ) : cloudScripts.length === 0 ? (
                <div className="prompter-empty-state">
                  <Cloud size={36} />
                  <span>Nenhum roteiro salvo encontrado na nuvem.</span>
                </div>
              ) : (
                cloudScripts.map((script) => (
                  <div key={script.id} className="prompter-cloud-card">
                    <div className="prompter-cloud-card-info">
                      <div className="prompter-cloud-card-header">
                        <h4>{script.title}</h4>
                        <span className="prompter-category-badge">{script.category}</span>
                      </div>
                      <p className="prompter-cloud-card-preview">
                        {script.content.slice(0, 140)}...
                      </p>
                      <span className="prompter-cloud-card-date">Atualizado em {script.updatedAt}</span>
                    </div>
                    <button
                      type="button"
                      className="operator-send-to-prompter-btn"
                      onClick={() => handleLoadCloudScriptToPrompter(script)}
                    >
                      <Send size={16} />
                      <span>Enviar ao Prompter</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
