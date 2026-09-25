import React, { useRef, useState } from 'react';
import { Download, Play, Pause, Loader2, Check, Music, Sparkles, ZoomIn } from 'lucide-react';
import type { CampaignVideo, MediaFolder } from '../../../types/videos';
import './VideoCard.css';

interface VideoCardProps {
  video: CampaignVideo;
  isDownloading: boolean;
  onDownload: (video: CampaignVideo) => void;
  onPlayVideo?: (video: CampaignVideo) => void;
  onExpandImage?: (video: CampaignVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isDownloading,
  onDownload,
  onPlayVideo,
  onExpandImage
}) => {
  const folder: MediaFolder = video.folder || 'videos';
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Controle de reprodução para áudio/música local
  const togglePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlayingAudio(true);
    } else {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleBoxClick = () => {
    if (folder === 'videos') {
      onPlayVideo?.(video);
    } else if (folder === 'imagens' || folder === 'figurinhas') {
      onExpandImage?.(video);
    }
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDownload(video);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const getDownloadBtnText = () => {
    if (isDownloading) return 'Baixando...';
    if (downloadSuccess) return 'Baixado com sucesso!';
    switch (folder) {
      case 'imagens':
        return 'Baixar Imagem';
      case 'musica':
        return 'Baixar Música';
      case 'figurinhas':
        return 'Baixar Figurinha';
      case 'videos':
      default:
        return 'Baixar Vídeo';
    }
  };

  return (
    <article className="video-supporter-card">
      {/* Máscara 1:1 com clique para abrir player em tela cheia (vídeo) ou ampliar (imagem) */}
      <div
        className={`video-mask-1x1 ${folder} clickable`}
        onClick={handleBoxClick}
        role="button"
        tabIndex={0}
        aria-label={folder === 'videos' ? 'Assistir vídeo' : 'Ampliar imagem'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleBoxClick();
          }
        }}
      >
        {folder === 'videos' && (
          <>
            <video
              src={video.videoUrl}
              poster={video.posterUrl}
              preload="metadata"
              playsInline
              muted
              className="video-element-cover"
            />

            <button
              type="button"
              className="video-play-overlay-btn"
              aria-label="Assistir em tela cheia"
              onClick={(e) => {
                e.stopPropagation();
                onPlayVideo?.(video);
              }}
            >
              <Play size={26} fill="currentColor" />
            </button>
          </>
        )}

        {folder === 'imagens' && (
          <div className="image-preview-wrapper">
            <img
              src={video.videoUrl || video.posterUrl}
              alt={video.title}
              className="media-image-cover"
              loading="lazy"
            />
            <div className="media-expand-hint-badge" title="Clique para ampliar">
              <ZoomIn size={14} />
              <span>Ampliar</span>
            </div>
          </div>
        )}

        {folder === 'musica' && (
          <div className="audio-preview-wrapper" onClick={togglePlayAudio}>
            <audio
              ref={audioRef}
              src={video.videoUrl}
              onPlay={() => setIsPlayingAudio(true)}
              onPause={() => setIsPlayingAudio(false)}
              onEnded={() => setIsPlayingAudio(false)}
            />

            {video.posterUrl ? (
              <img src={video.posterUrl} alt="" className="audio-cover-img" />
            ) : (
              <div className="audio-vinyl-art">
                <Music size={38} className="vinyl-icon" />
              </div>
            )}

            <button
              type="button"
              className="audio-play-btn"
              aria-label={isPlayingAudio ? 'Pausar áudio' : 'Ouvir áudio'}
              onClick={togglePlayAudio}
            >
              {isPlayingAudio ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
            </button>
          </div>
        )}

        {folder === 'figurinhas' && (
          <div className="sticker-preview-wrapper">
            <div className="sticker-pattern-grid" />
            <img
              src={video.videoUrl || video.posterUrl}
              alt={video.title}
              className="sticker-image-contain"
              loading="lazy"
            />
            <div className="sticker-tag-badge">
              <Sparkles size={11} />
              <span>Figurinha</span>
            </div>
            <div className="media-expand-hint-badge" title="Clique para ampliar">
              <ZoomIn size={14} />
              <span>Ampliar</span>
            </div>
          </div>
        )}

        {/* Legenda centralizada DENTRO do box do vídeo/mídia */}
        <div className="video-box-caption">
          <span className="caption-text">{video.title}</span>
        </div>
      </div>

      {/* Conteúdo do Card: Botão de Download Direto */}
      <div className="video-card-body">
        <button
          type="button"
          className={`btn-video-download ${downloadSuccess ? 'success' : ''}`}
          onClick={handleDownloadClick}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 size={17} className="spinner" />
              <span>{getDownloadBtnText()}</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check size={17} />
              <span>{getDownloadBtnText()}</span>
            </>
          ) : (
            <>
              <Download size={17} />
              <span>{getDownloadBtnText()}</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
