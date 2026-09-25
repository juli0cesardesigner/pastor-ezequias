import React, { useState } from 'react';
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Music,
  Sparkles,
  Layers
} from 'lucide-react';
import { useCampaignVideos } from '../../../hooks/useCampaignVideos';
import { AdminVideoModal } from './AdminVideoModal';
import type { CampaignVideo, MediaFolder } from '../../../types/videos';
import './AdminVideosTab.css';

export const AdminVideosTab: React.FC = () => {
  const {
    videos,
    filteredVideos,
    activeFolder,
    setActiveFolder,
    folderCounts,
    isLoading,
    error,
    loadVideos,
    handleSave,
    handleDelete,
    handleToggleActive
  } = useCampaignVideos(false); // Carrega todos, incluindo inativos

  const [selectedVideo, setSelectedVideo] = useState<CampaignVideo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setSelectedVideo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (video: CampaignVideo) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async (video: CampaignVideo) => {
    if (window.confirm(`Tem certeza que deseja remover "${video.title}"?`)) {
      const ok = await handleDelete(video.id);
      if (ok) {
        showFeedback('Item removido com sucesso!');
      }
    }
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const getFolderLabel = (f: MediaFolder) => {
    switch (f) {
      case 'imagens':
        return 'Imagem';
      case 'musica':
        return 'Música';
      case 'figurinhas':
        return 'Figurinha';
      case 'videos':
      default:
        return 'Vídeo';
    }
  };

  const getFolderIcon = (f: MediaFolder) => {
    switch (f) {
      case 'imagens':
        return <ImageIcon size={12} />;
      case 'musica':
        return <Music size={12} />;
      case 'figurinhas':
        return <Sparkles size={12} />;
      case 'videos':
      default:
        return <Film size={12} />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="admin-tab-content">
      {feedback && (
        <div className="admin-toast-feedback success">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Seção de Gerenciamento de Mídias e Pastas */}
      <div className="admin-section-flat">
        <div className="section-flat-header space-between">
          <div className="setting-title-wrap">
            <Film size={18} className="text-gold" />
            <div>
              <h3 className="section-flat-title">Materiais & Mídias da Campanha</h3>
              <p className="section-flat-subtitle">
                Gerencie vídeos, imagens, músicas e figurinhas (ordem do mais recente ao mais antigo)
              </p>
            </div>
          </div>

          <div className="catalog-header-actions">
            <button
              type="button"
              className="btn-seed-defaults"
              onClick={loadVideos}
              title="Recarregar lista"
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
              <span>Atualizar</span>
            </button>
            <button type="button" className="btn-add-material" onClick={handleOpenAdd}>
              <Plus size={15} />
              <span>Nova Mídia</span>
            </button>
          </div>
        </div>

        {/* Abas de Pastas para Filtro Administrativo */}
        <div className="admin-folder-filter-bar">
          <button
            type="button"
            className={`admin-filter-pill ${activeFolder === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFolder('all')}
          >
            <Layers size={14} />
            <span>Todas as Pastas ({videos.length})</span>
          </button>

          <button
            type="button"
            className={`admin-filter-pill ${activeFolder === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveFolder('videos')}
          >
            <Film size={14} />
            <span>Vídeos ({folderCounts.videos})</span>
          </button>

          <button
            type="button"
            className={`admin-filter-pill ${activeFolder === 'imagens' ? 'active' : ''}`}
            onClick={() => setActiveFolder('imagens')}
          >
            <ImageIcon size={14} />
            <span>Imagens ({folderCounts.imagens})</span>
          </button>

          <button
            type="button"
            className={`admin-filter-pill ${activeFolder === 'musica' ? 'active' : ''}`}
            onClick={() => setActiveFolder('musica')}
          >
            <Music size={14} />
            <span>Música ({folderCounts.musica})</span>
          </button>

          <button
            type="button"
            className={`admin-filter-pill ${activeFolder === 'figurinhas' ? 'active' : ''}`}
            onClick={() => setActiveFolder('figurinhas')}
          >
            <Sparkles size={14} />
            <span>Figurinhas ({folderCounts.figurinhas})</span>
          </button>
        </div>

        {isLoading ? (
          <div className="admin-videos-loading">
            <RefreshCw size={24} className="spinner text-gold" />
            <span>Carregando mídias...</span>
          </div>
        ) : error ? (
          <div className="admin-videos-error">
            <span>{error}</span>
            <button type="button" onClick={loadVideos} className="btn-retry-admin">
              Tentar Novamente
            </button>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="admin-catalog-empty-state">
            <div className="empty-icon-wrap">
              <Film size={32} />
            </div>
            <h4>Nenhuma mídia nesta pasta</h4>
            <p>Clique em "+ Nova Mídia" para cadastrar conteúdo no Wix.</p>
          </div>
        ) : (
          <div className="admin-videos-list">
            {filteredVideos.map((item) => (
              <div
                key={item.id}
                className={`admin-video-card-row ${!item.isActive ? 'is-inactive' : ''}`}
              >
                {/* Miniatura 1:1 compacta */}
                <div className="admin-video-thumb-1x1">
                  {item.posterUrl || item.videoUrl ? (
                    <img
                      src={item.posterUrl || item.videoUrl}
                      alt=""
                      className="admin-thumb-img"
                    />
                  ) : (
                    <div className="admin-thumb-placeholder">
                      {getFolderIcon(item.folder || 'videos')}
                    </div>
                  )}
                  <span className="admin-thumb-badge">1:1</span>
                </div>

                {/* Dados da Mídia */}
                <div className="admin-video-info">
                  <div className="admin-video-top-line">
                    <span className={`folder-pill ${item.folder || 'videos'}`}>
                      {getFolderIcon(item.folder || 'videos')}
                      <span>{getFolderLabel(item.folder || 'videos')}</span>
                    </span>

                    <h4 className="admin-video-name">{item.title}</h4>

                    <span className={`status-pill ${item.isActive ? 'active' : 'inactive'}`}>
                      {item.isActive ? 'Ativo' : 'Oculto'}
                    </span>
                  </div>

                  <div className="admin-video-meta">
                    <span className="meta-item">
                      <Download size={13} />
                      <strong>{item.downloadCount || 0}</strong> downloads
                    </span>

                    {item.createdAt && (
                      <span className="meta-item">
                        Adicionado em: <strong>{formatDate(item.createdAt)}</strong>
                      </span>
                    )}

                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meta-link"
                      title="Abrir arquivo no navegador"
                    >
                      <ExternalLink size={12} />
                      <span>Ver Arquivo</span>
                    </a>
                  </div>
                </div>

                {/* Ações da Linha */}
                <div className="admin-video-row-actions">
                  <button
                    type="button"
                    className={`btn-action-icon ${item.isActive ? 'active-toggle' : 'inactive-toggle'}`}
                    onClick={() => handleToggleActive(item)}
                    title={item.isActive ? 'Ocultar do site' : 'Ativar no site'}
                  >
                    {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>

                  <button
                    type="button"
                    className="btn-action-icon edit"
                    onClick={() => handleOpenEdit(item)}
                    title="Editar informações"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn-action-icon delete"
                    onClick={() => handleConfirmDelete(item)}
                    title="Excluir mídia"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AdminVideoModal
          video={selectedVideo}
          initialFolder={activeFolder === 'all' ? 'videos' : activeFolder}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
