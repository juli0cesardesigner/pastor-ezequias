import React from 'react';
import {
  FileText,
  Plus,
  Play,
  Edit,
  Trash2,
  Search,
  Wifi,
  Bluetooth,
  Sliders,
  RefreshCw,
  Clock,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import type { CloudScript } from '../../../services/prompterService';
import type { PrompterDraft } from '../hooks/usePrompterStorage';
import { calculateSpeechTime } from '../utils/prompterSpeechTime';
import './PrompterDashboard.css';

interface PrompterDashboardProps {
  // Roteiros na Nuvem
  cloudScripts: CloudScript[];
  filteredCloudScripts: CloudScript[];
  isLoadingCloud: boolean;
  cloudError: string | null;
  onRefreshCloud: () => void;
  // Ações
  onNewScript: () => void;
  onEditScript: (script: CloudScript) => void;
  onPlayScript: (script: CloudScript) => void;
  onDeleteScript: (id: number, title: string) => void;
  // Busca
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Conexões e Hardware
  isRemoteConnected: boolean;
  onOpenRemoteModal: () => void;
  isP2PConnected: boolean;
  onOpenP2PModal: () => void;
  // Rascunhos locais e ajustes
  drafts: PrompterDraft[];
  onOpenDrafts: () => void;
  onOpenSettings: () => void;
  speed: number;
}

export const PrompterDashboard: React.FC<PrompterDashboardProps> = ({
  cloudScripts,
  filteredCloudScripts,
  isLoadingCloud,
  cloudError,
  onRefreshCloud,
  onNewScript,
  onEditScript,
  onPlayScript,
  onDeleteScript,
  searchQuery,
  onSearchChange,
  isRemoteConnected,
  onOpenRemoteModal,
  isP2PConnected,
  onOpenP2PModal,
  drafts,
  onOpenDrafts,
  onOpenSettings,
  speed,
}) => {
  return (
    <div className="prompter-dashboard">
      {/* Topo / Navbar do Dashboard */}
      <header className="prompter-dashboard-header">
        {/* Barra de Hardware e Conectividade */}
        <div className="dashboard-hardware-bar">
          <button
            type="button"
            className={`hw-badge-btn ${isRemoteConnected ? 'connected' : ''}`}
            onClick={onOpenRemoteModal}
            title="Controle Remoto Bluetooth Feelworld"
          >
            <Bluetooth size={15} />
            <span>{isRemoteConnected ? 'Feelworld Ativo' : 'Bluetooth'}</span>
          </button>

          <button
            type="button"
            className={`hw-badge-btn ${isP2PConnected ? 'connected' : ''}`}
            onClick={onOpenP2PModal}
            title="Conexão com Operador Remoto via QR Code"
          >
            <Wifi size={15} />
            <span>{isP2PConnected ? 'Operador Pareado' : 'Parear Operador'}</span>
          </button>

          {drafts.length > 0 && (
            <button
              type="button"
              className="hw-badge-btn subtle"
              onClick={onOpenDrafts}
              title="Rascunhos salvos no navegador"
            >
              <FolderOpen size={15} />
              <span>Rascunhos ({drafts.length})</span>
            </button>
          )}

          <button
            type="button"
            className="hw-badge-btn icon-only"
            onClick={onOpenSettings}
            title="Ajustes de Leitura"
          >
            <Sliders size={16} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal do Dashboard */}
      <main className="prompter-dashboard-content">
        {/* Banner de Ação Primária */}
        <section className="dashboard-hero-action">
          <div className="hero-text">
            <h2>Pronto para Gravar?</h2>
            <p>Selecione um roteiro salvo abaixo ou inicie um texto do zero.</p>
          </div>
          <button
            type="button"
            className="hero-new-btn"
            onClick={onNewScript}
          >
            <Plus size={18} />
            <span>Novo Roteiro em Branco</span>
          </button>
        </section>

        {/* Seção da Biblioteca de Roteiros */}
        <section className="dashboard-library-section">
          <div className="library-toolbar">
            <div className="library-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Pesquisar roteiros por título, assunto ou trecho..."
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

            <button
              type="button"
              className="library-refresh-btn"
              onClick={onRefreshCloud}
              disabled={isLoadingCloud}
              title="Recarregar roteiros da nuvem"
            >
              <RefreshCw size={16} className={isLoadingCloud ? 'spin-anim' : ''} />
              <span>Sincronizar</span>
            </button>
          </div>

          {cloudError && (
            <div className="cloud-error-banner">
              <AlertCircle size={16} />
              <span>{cloudError}</span>
              <button type="button" onClick={onRefreshCloud} className="retry-btn">
                Tentar novamente
              </button>
            </div>
          )}

          {/* Grid de Roteiros */}
          <div className="scripts-grid">
            {isLoadingCloud && cloudScripts.length === 0 ? (
              <div className="dashboard-loading-state">
                <RefreshCw size={28} className="spin-anim text-amber" />
                <p>Buscando seus roteiros na nuvem...</p>
              </div>
            ) : filteredCloudScripts.length === 0 ? (
              <div className="dashboard-empty-state">
                <FileText size={42} className="text-zinc" />
                <h3>Nenhum roteiro encontrado</h3>
                <p>
                  {searchQuery
                    ? 'Nenhum roteiro corresponde aos termos digitados.'
                    : 'Crie seu primeiro roteiro para gravar com facilidade!'}
                </p>
                <button
                  type="button"
                  className="empty-create-btn"
                  onClick={onNewScript}
                >
                  <Plus size={16} /> Criar Novo Roteiro
                </button>
              </div>
            ) : (
              filteredCloudScripts.map((script) => {
                const words = script.content.trim().split(/\s+/).filter(Boolean).length;
                const scriptSpeechTime = calculateSpeechTime(words, speed);

                return (
                  <article key={script.id} className="script-card">
                    <div className="script-card-header">
                      <span className="script-date">{script.updatedAt}</span>
                    </div>

                    <h3 className="script-title">{script.title}</h3>
                    <p className="script-snippet">{script.content.slice(0, 150)}...</p>

                    <div className="script-meta-row">
                      <span className="meta-item">
                        <strong>{words}</strong> palavras
                      </span>
                      <span className="meta-sep">•</span>
                      <span className="meta-item time">
                        <Clock size={12} /> {scriptSpeechTime}
                      </span>
                    </div>

                    <div className="script-actions-row">
                      <button
                        type="button"
                        className="card-action-btn delete"
                        onClick={() => onDeleteScript(script.id, script.title)}
                        title="Excluir roteiro"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        type="button"
                        className="card-action-btn edit"
                        onClick={() => onEditScript(script)}
                        title="Editar roteiro"
                      >
                        <Edit size={16} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        className="card-action-btn play"
                        onClick={() => onPlayScript(script)}
                        title="Iniciar Teleprompter"
                      >
                        <Play size={16} className="play-icon-offset" />
                        <span>Gravar</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
