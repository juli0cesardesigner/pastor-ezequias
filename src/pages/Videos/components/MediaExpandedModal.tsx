import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2, Check, X } from 'lucide-react';
import type { CampaignVideo, MediaFolder } from '../../../types/videos';
import './MediaExpandedModal.css';

interface MediaExpandedModalProps {
  media: CampaignVideo;
  mode: 'video' | 'image';
  isDownloading: boolean;
  onDownload: (media: CampaignVideo) => void;
  onClose: () => void;
}

export const MediaExpandedModal: React.FC<MediaExpandedModalProps> = ({
  media,
  mode,
  isDownloading,
  onDownload,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Bloqueia rolagem do body enquanto o modal estiver aberto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDownloadClick = async () => {
    await onDownload(media);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const getDownloadText = () => {
    if (isDownloading) return 'Baixando arquivo...';
    if (downloadSuccess) return 'Download concluído!';
    const folder: MediaFolder = media.folder || 'videos';
    switch (folder) {
      case 'imagens':
        return 'Baixar Imagem em Alta Resolução';
      case 'figurinhas':
        return 'Baixar Figurinha';
      case 'videos':
      default:
        return 'Baixar Vídeo (MP4)';
    }
  };

  return (
    <div
      className="media-expanded-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Barra Superior de Controles: Voltar + Título + Fechar */}
      <header className="expanded-top-bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn-expanded-back"
          onClick={onClose}
          aria-label="Voltar para a galeria"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>

        <h2 className="expanded-top-title" title={media.title}>
          {media.title}
        </h2>

        <div className="expanded-top-actions">
          <button
            type="button"
            className={`btn-top-download-quick ${downloadSuccess ? 'success' : ''}`}
            onClick={handleDownloadClick}
            disabled={isDownloading}
            title="Download direto"
          >
            {isDownloading ? (
              <Loader2 size={16} className="spinner" />
            ) : downloadSuccess ? (
              <Check size={16} />
            ) : (
              <Download size={16} />
            )}
            <span className="hide-on-mobile">Baixar</span>
          </button>

          <button
            type="button"
            className="btn-expanded-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Palco Central: Player de Vídeo ou Visualizador de Imagem */}
      <main className="expanded-stage" onClick={(e) => e.stopPropagation()}>
        {mode === 'video' ? (
          <div className="expanded-video-container">
            <video
              ref={videoRef}
              src={media.videoUrl}
              poster={media.posterUrl}
              autoPlay
              controls
              playsInline
              className="expanded-media-element video"
            />
          </div>
        ) : (
          <div className="expanded-image-container">
            <img
              src={media.videoUrl || media.posterUrl}
              alt={media.title}
              className="expanded-media-element image"
            />
          </div>
        )}
      </main>

      {/* Barra Inferior com Botão em Destaque de Download Direto */}
      <footer className="expanded-bottom-bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`btn-expanded-download-main ${downloadSuccess ? 'success' : ''}`}
          onClick={handleDownloadClick}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Baixando arquivo...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check size={18} />
              <span>Download Concluído!</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>{getDownloadText()}</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
