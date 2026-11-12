import React from 'react';
import {
  Cloud,
  RefreshCw,
  Search,
  FileText,
  Plus,
  Trash2,
  Edit,
  Play,
  AlertCircle,
} from 'lucide-react';
import type { CloudScript } from '../../../services/prompterService';
import { calculateSpeechTime } from '../utils/prompterSpeechTime';

interface PrompterCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudScripts: CloudScript[];
  filteredCloudScripts: CloudScript[];
  isLoading: boolean;
  error: string | null;
  activeScriptId: number | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onLoadScript: (script: CloudScript) => void;
  onPlayScript: (script: CloudScript) => void;
  onDeleteScript: (id: number, title: string) => void;
  onOpenSaveNew?: () => void;
  hasCurrentText: boolean;
  speed: number;
}

export const PrompterCloudModal: React.FC<PrompterCloudModalProps> = ({
  isOpen,
  onClose,
  cloudScripts,
  filteredCloudScripts,
  isLoading,
  error,
  activeScriptId,
  searchQuery,
  onSearchChange,
  onRefresh,
  onLoadScript,
  onPlayScript,
  onDeleteScript,
  onOpenSaveNew,
  hasCurrentText,
  speed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="prompter-modal-backdrop" onClick={onClose}>
      <div className="prompter-cloud-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <div className="cloud-icon-badge">
              <Cloud size={20} className="text-amber" />
            </div>
            <div>
              <h2 className="modal-title">Roteiros na Nuvem</h2>
              <p className="modal-subtitle">
                Acessíveis em tempo real de qualquer celular, tablet ou computador.
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="icon-action-btn"
              onClick={onRefresh}
              title="Atualizar lista"
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? 'spin-anim' : ''} />
            </button>
            <button
              type="button"
              className="close-modal-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-search-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar por título ou trecho..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => onSearchChange('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="cloud-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button type="button" onClick={onRefresh} className="retry-btn">
              Tentar novamente
            </button>
          </div>
        )}

        <div className="cloud-scripts-list">
          {isLoading && cloudScripts.length === 0 ? (
            <div className="cloud-loading-state">
              <RefreshCw size={24} className="spin-anim text-amber" />
              <p>Conectando ao banco de dados...</p>
            </div>
          ) : filteredCloudScripts.length === 0 ? (
            <div className="cloud-empty-state">
              <FileText size={36} className="text-zinc" />
              <h3>Nenhum roteiro encontrado</h3>
              <p>
                {searchQuery
                  ? 'Nenhum resultado para os termos pesquisados.'
                  : 'Crie seu primeiro roteiro e salve na nuvem para usar em qualquer lugar!'}
              </p>
              {hasCurrentText && onOpenSaveNew && (
                <button
                  type="button"
                  className="create-cloud-btn"
                  onClick={() => {
                    onClose();
                    onOpenSaveNew();
                  }}
                >
                  <Plus size={16} /> Salvar Texto Atual na Nuvem
                </button>
              )}
            </div>
          ) : (
            filteredCloudScripts.map((script) => {
              const words = script.content.trim().split(/\s+/).filter(Boolean).length;
              const scriptSpeechTime = calculateSpeechTime(words, speed);
              const isCurrent = activeScriptId === script.id;

              return (
                <div
                  key={script.id}
                  className={`cloud-script-card ${isCurrent ? 'is-current' : ''}`}
                >
                  <div className="script-card-header">
                    <span className="script-card-date">{script.updatedAt}</span>
                  </div>

                  <h3 className="script-card-title">{script.title}</h3>
                  <p className="script-card-preview">{script.content.slice(0, 140)}...</p>

                  <div className="script-card-footer">
                    <div className="script-stats">
                      <span><strong>{words}</strong> palavras</span>
                      <span className="dot">•</span>
                      <span><strong>{scriptSpeechTime}</strong></span>
                    </div>

                    <div className="script-card-buttons">
                      <button
                        type="button"
                        className="card-btn delete"
                        onClick={() => onDeleteScript(script.id, script.title)}
                        title="Excluir da nuvem"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="card-btn edit"
                        onClick={() => onLoadScript(script)}
                        title="Carregar no Editor"
                      >
                        <Edit size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className="card-btn play"
                        onClick={() => onPlayScript(script)}
                        title="Iniciar Teleprompter Direto"
                      >
                        <Play size={16} className="play-icon-offset" />
                        <span>Ler Agora</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
