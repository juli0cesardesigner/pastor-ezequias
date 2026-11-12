import React from 'react';
import {
  ArrowLeft,
  Bluetooth,
  Cloud,
  Wifi,
  CloudUpload,
  Bookmark,
  Trash2,
  Check,
  Play,
  FileText,
  Clock,
  Laptop,
} from 'lucide-react';
import type { PrompterSettings } from '../hooks/usePrompterStorage';
import type { CloudScript } from '../../../services/prompterService';
import { calculateScriptStats, calculateSpeechTime } from '../utils/prompterSpeechTime';

interface PrompterEditorViewProps {
  text: string;
  onTextChange: (newText: string) => void;
  settings: PrompterSettings;
  activeCloudScript: CloudScript | null;
  cloudScriptsCount: number;
  draftsCount: number;
  // Navegação
  onBackToDashboard: () => void;
  onStartReading: () => void;
  // Ações de Nuvem & Hardware
  onOpenCloudModal: () => void;
  onOpenSaveCloudModal: () => void;
  onOpenRemoteModal: () => void;
  onOpenP2PModal: () => void;
  onToggleDraftsList: () => void;
  onClearText: () => void;
  onOpenOperatorMode: () => void;
  // Estados de Hardware
  isRemoteConnected: boolean;
  isP2PConnected: boolean;
  copiedNotification: string | null;
  editorTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const PrompterEditorView: React.FC<PrompterEditorViewProps> = ({
  text,
  onTextChange,
  settings,
  activeCloudScript,
  cloudScriptsCount,
  draftsCount,
  onBackToDashboard,
  onStartReading,
  onOpenCloudModal,
  onOpenSaveCloudModal,
  onOpenRemoteModal,
  onOpenP2PModal,
  onToggleDraftsList,
  onClearText,
  onOpenOperatorMode,
  isRemoteConnected,
  isP2PConnected,
  copiedNotification,
  editorTextareaRef,
}) => {
  const stats = calculateScriptStats(text);
  const speechTime = calculateSpeechTime(stats.words, settings.speed);

  return (
    <div className="prompter-editor-container">
      {/* Topo do Editor */}
      <header className="prompter-editor-header">
        <div className="prompter-header-brand">
          <div className="prompter-badge-tag">
            <button
              type="button"
              className="back-hub-pill-btn"
              onClick={onBackToDashboard}
              title="Voltar ao Painel Principal"
            >
              <ArrowLeft size={13} />
              <span>Início / Hub</span>
            </button>

            <span className="dot-divider">•</span>

            <button
              type="button"
              className="cloud-status-pill"
              onClick={onOpenCloudModal}
              title="Abrir Roteiros na Nuvem"
            >
              <Cloud size={13} className="text-amber" />
              <span>Nuvem ({cloudScriptsCount})</span>
            </button>

            <span className="dot-divider">•</span>

            <button
              type="button"
              className={`p2p-header-pill ${isRemoteConnected ? 'is-connected' : ''}`}
              onClick={onOpenRemoteModal}
              title="Controle Remoto Bluetooth Feelworld"
            >
              <Bluetooth size={13} className={isRemoteConnected ? 'text-cyan-400' : 'text-zinc-400'} />
              <span>{isRemoteConnected ? 'Controle Ativo' : 'Controle BLE'}</span>
            </button>
          </div>

          <h1 className="prompter-title">
            {activeCloudScript ? activeCloudScript.title : 'Roteiro de Leitura'}
          </h1>
        </div>

        <div className="prompter-header-stats">
          <button
            type="button"
            className="operator-mode-toggle-btn"
            onClick={onOpenOperatorMode}
            title="Abrir Deck de Operador"
          >
            <Laptop size={14} />
            <span>Modo Operador</span>
          </button>

          <div className="stat-pill" title="Contagem de palavras">
            <FileText size={15} />
            <span><strong>{stats.words}</strong> pal.</span>
          </div>

          <div className="stat-pill highlight" title="Tempo estimado de fala">
            <Clock size={15} />
            <span><strong>{speechTime}</strong></span>
          </div>
        </div>
      </header>

      {/* Área Central / Textarea com Quick Actions */}
      <main className="prompter-editor-main">
        <div className="editor-textarea-wrapper">
          <textarea
            ref={editorTextareaRef}
            className="prompter-textarea"
            placeholder="Cole ou digite aqui seu texto para o teleprompter...&#10;&#10;Qualquer membro da equipe pode salvar e carregar roteiros em tempo real pela Nuvem!"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
          />

          <div className="textarea-quick-actions">
            <div className="left-actions">
              <button
                type="button"
                className="action-pill-btn cloud-btn"
                onClick={onOpenCloudModal}
              >
                <Cloud size={14} />
                <span>Roteiros na Nuvem ({cloudScriptsCount})</span>
              </button>

              <button
                type="button"
                className={`action-pill-btn p2p-action-btn ${isP2PConnected ? 'is-connected' : ''}`}
                onClick={onOpenP2PModal}
              >
                <Wifi size={14} className={isP2PConnected ? 'text-emerald-400' : ''} />
                <span>{isP2PConnected ? 'Operador Conectado' : 'Parear Operador'}</span>
              </button>

              {text.trim().length > 0 && (
                <button
                  type="button"
                  className="action-pill-btn highlight"
                  onClick={onOpenSaveCloudModal}
                >
                  <CloudUpload size={14} />
                  <span>{activeCloudScript ? 'Atualizar Nuvem' : 'Salvar na Nuvem'}</span>
                </button>
              )}
            </div>

            <div className="right-actions">
              {draftsCount > 0 && (
                <button
                  type="button"
                  className="action-pill-btn"
                  onClick={onToggleDraftsList}
                >
                  <Bookmark size={14} />
                  <span>Rascunhos ({draftsCount})</span>
                </button>
              )}

              {text.trim().length > 0 && (
                <button
                  type="button"
                  className="action-pill-btn danger"
                  onClick={onClearText}
                >
                  <Trash2 size={14} />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {copiedNotification && (
          <div className="prompter-toast-alert">
            <Check size={16} />
            <span>{copiedNotification}</span>
          </div>
        )}
      </main>

      {/* Rodapé com Resumo de Settings e Botão Iniciar */}
      <footer className="prompter-editor-footer">
        <div className="prompter-settings-preview">
          <span className="settings-summary-item">
            Fonte: <strong>{settings.fontSize}px</strong>
          </span>
          <span className="settings-summary-item">
            Velocidade: <strong>{settings.speed}</strong>
          </span>
          <span className="settings-summary-item">
            Largura: <strong>{settings.maxWidth}px</strong>
          </span>
        </div>

        <div className="prompter-primary-actions">
          <button
            type="button"
            className="prompter-start-btn"
            disabled={!text.trim()}
            onClick={onStartReading}
          >
            <Play size={22} className="play-icon-offset" />
            <span>Iniciar Teleprompter</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
