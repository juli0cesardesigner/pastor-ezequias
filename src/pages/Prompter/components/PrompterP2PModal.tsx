import React, { useState, useEffect } from 'react';
import { Wifi, Copy, Check, QrCode, X, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { p2pManager } from '../../../services/prompterP2PService';

interface PrompterP2PModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomCode: string | null;
  onStartHosting: () => Promise<string>;
  isConnected: boolean;
  statusMessage?: string;
}

export const PrompterP2PModal: React.FC<PrompterP2PModalProps> = ({
  isOpen,
  onClose,
  currentRoomCode,
  onStartHosting,
  isConnected,
  statusMessage,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Determinar link completo de pareamento
  const getOperatorUrl = (code: string) => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?role=operator&room=${encodeURIComponent(code)}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initOrUpdateCode = async () => {
      let code = currentRoomCode;
      if (!code) {
        setIsInitializing(true);
        try {
          code = await onStartHosting();
        } catch (err) {
          console.error('Erro ao iniciar Host P2P:', err);
        } finally {
          if (isMounted) setIsInitializing(false);
        }
      }

      if (code && isMounted) {
        const url = getOperatorUrl(code);
        try {
          const qr = await QRCode.toDataURL(url, {
            width: 220,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          if (isMounted) setQrDataUrl(qr);
        } catch (err) {
          console.error('Erro ao gerar QR Code:', err);
        }
      }
    };

    initOrUpdateCode();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentRoomCode, onStartHosting]);

  if (!isOpen) return null;

  const operatorUrl = currentRoomCode ? getOperatorUrl(currentRoomCode) : '';

  const handleCopyCode = async () => {
    if (!currentRoomCode) return;
    try {
      await navigator.clipboard.writeText(currentRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    if (!operatorUrl) return;
    try {
      await navigator.clipboard.writeText(operatorUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="prompter-modal-backdrop" onClick={onClose}>
      <div className="prompter-p2p-modal" onClick={(e) => e.stopPropagation()}>
        <header className="prompter-p2p-header">
          <div className="prompter-p2p-header-title">
            <div className="prompter-p2p-icon-badge">
              <Wifi size={20} className={isConnected ? 'text-emerald-400' : 'text-amber-400'} />
            </div>
            <div>
              <h3>Parear com Notebook Operador</h3>
              <p>Edição simultânea ao vivo e controle remoto da gravação</p>
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

        <div className="prompter-p2p-body">
          {/* Status Badge */}
          <div className={`prompter-p2p-status-card ${isConnected ? 'is-connected' : 'is-waiting'}`}>
            <div className="p2p-status-dot" />
            <div className="p2p-status-text">
              <strong>{isConnected ? 'Operador Conectado!' : 'Aguardando Operador...'}</strong>
              <span>
                {isConnected
                  ? 'Qualquer edição no notebook atualiza esta tela instantaneamente.'
                  : statusMessage || 'Aponte a câmera do notebook ou digite o código abaixo.'}
              </span>
            </div>
          </div>

          <div className="prompter-p2p-pairing-grid">
            {/* Coluna 1: QR Code */}
            <div className="prompter-p2p-qr-box">
              <div className="p2p-qr-wrapper">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code para conectar Operador" className="p2p-qr-image" />
                ) : (
                  <div className="p2p-qr-placeholder">
                    <QrCode size={48} className="animate-pulse opacity-50" />
                    <span>{isInitializing ? 'Gerando sala...' : 'Carregando...'}</span>
                  </div>
                )}
              </div>
              <span className="p2p-qr-caption">Escaneie com a câmera do celular/notebook</span>
            </div>

            {/* Coluna 2: Código e Link */}
            <div className="prompter-p2p-code-box">
              <label className="p2p-field-label">Código de Pareamento</label>
              <div className="p2p-code-display">
                <span className="p2p-large-code">{currentRoomCode || '---'}</span>
                <button
                  type="button"
                  className="p2p-copy-btn"
                  onClick={handleCopyCode}
                  title="Copiar código"
                >
                  {copiedCode ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <label className="p2p-field-label" style={{ marginTop: '16px' }}>
                Ou abra o Link direto no Notebook:
              </label>
              <div className="p2p-link-display">
                <input
                  type="text"
                  readOnly
                  value={operatorUrl}
                  className="p2p-link-input"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  className="p2p-copy-btn"
                  onClick={handleCopyLink}
                  title="Copiar link"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="p2p-safety-badge">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Roteiros salvos no Neon permanecem 100% seguros e preservados.</span>
              </div>
            </div>
          </div>

          <div className="prompter-p2p-instructions">
            <div className="p2p-instruction-step">
              <span className="p2p-step-number">1</span>
              <span>Deixe este celular posicionado no prompter/câmera.</span>
            </div>
            <div className="p2p-instruction-step">
              <span className="p2p-step-number">2</span>
              <span>Abra o link ou código no notebook para editar o texto ao vivo.</span>
            </div>
            <div className="p2p-instruction-step">
              <span className="p2p-step-number">3</span>
              <span>O operador pode dar Play/Pause e ajustar a velocidade à distância.</span>
            </div>
          </div>
        </div>

        <footer className="prompter-p2p-footer">
          {isConnected && (
            <button
              type="button"
              className="p2p-disconnect-btn"
              onClick={() => {
                p2pManager.disconnect();
              }}
            >
              Desconectar Operador
            </button>
          )}
          <button type="button" className="p2p-close-action-btn" onClick={onClose}>
            {isConnected ? 'Voltar ao Prompter' : 'Fechar Janela'}
          </button>
        </footer>
      </div>
    </div>
  );
};
