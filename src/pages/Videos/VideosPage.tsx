import React, { useState } from 'react';
import {
  ArrowLeft,
  Film,
  Image as ImageIcon,
  Music,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { useCampaignVideos } from '../../hooks/useCampaignVideos';
import { VideoCard } from './components/VideoCard';
import type { MediaFolder } from '../../types/videos';
import './VideosPage.css';

interface VideosPageProps {
  onBackToHome: () => void;
}

interface FolderTabItem {
  id: MediaFolder;
  label: string;
  icon: React.ReactNode;
}

export const VideosPage: React.FC<VideosPageProps> = ({ onBackToHome }) => {
  const [selectedFolder, setSelectedFolder] = useState<MediaFolder>('videos');

  const {
    videos,
    folderCounts,
    isLoading,
    error,
    downloadingId,
    loadVideos,
    handleDownload
  } = useCampaignVideos(true);

  // Lista dos 4 folders solicitados
  const folders: FolderTabItem[] = [
    { id: 'videos', label: 'Vídeos', icon: <Film size={16} /> },
    { id: 'imagens', label: 'Imagens', icon: <ImageIcon size={16} /> },
    { id: 'musica', label: 'Música', icon: <Music size={16} /> },
    { id: 'figurinhas', label: 'Figurinhas', icon: <Sparkles size={16} /> }
  ];

  // Itens da pasta selecionada (já ordenados do mais novo para o mais antigo)
  const currentItems = videos.filter((v) => (v.folder || 'videos') === selectedFolder);

  return (
    <div className="videos-page-container">
      {/* Top Bar de Navegação */}
      <div className="videos-header-nav">
        <button type="button" className="btn-videos-back" onClick={onBackToHome}>
          <ArrowLeft size={16} />
          <span>Voltar ao Início</span>
        </button>
      </div>

      {/* Cabeçalho da Página */}
      <header className="videos-page-header">
        <div className="videos-badge-pill">
          <FolderOpen size={15} />
          <span>Mídias & Materiais Oficiais</span>
        </div>
        <h1 className="videos-title">Materiais para Redes Sociais</h1>
        <p className="videos-subtitle">
          Selecione a pasta, assista à prévia e baixe o arquivo direto para postar em seus perfis.
        </p>
      </header>

      {/* Navegação por Pastas / Folders */}
      <nav className="media-folders-nav" aria-label="Pastas de mídias">
        {folders.map((folder) => {
          const isActive = selectedFolder === folder.id;
          const count = folderCounts[folder.id] || 0;

          return (
            <button
              key={folder.id}
              type="button"
              className={`media-folder-tab ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <span className="folder-icon">{folder.icon}</span>
              <span className="folder-name">{folder.label}</span>
              <span className="folder-badge-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* Conteúdo Principal da Pasta */}
      <main className="videos-main-content">
        {isLoading ? (
          <div className="videos-loading-state">
            <RefreshCw size={28} className="spinner text-gold" />
            <p>Carregando materiais...</p>
          </div>
        ) : error ? (
          <div className="videos-error-state">
            <AlertCircle size={28} className="text-danger" />
            <p>{error}</p>
            <button type="button" className="btn-retry" onClick={loadVideos}>
              <RefreshCw size={14} />
              <span>Tentar novamente</span>
            </button>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="videos-empty-state">
            <div className="empty-video-icon">
              {folders.find((f) => f.id === selectedFolder)?.icon}
            </div>
            <h3>Nenhum item na pasta "{folders.find((f) => f.id === selectedFolder)?.label}"</h3>
            <p>Novos conteúdos desta pasta serão adicionados em breve pela coordenação.</p>
          </div>
        ) : (
          <div className="videos-grid-compact">
            {currentItems.map((item) => (
              <VideoCard
                key={item.id}
                video={item}
                isDownloading={downloadingId === item.id}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
