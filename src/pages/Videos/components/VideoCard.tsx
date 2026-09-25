import React, { useRef, useState } from 'react';
import { Download, Play, Pause, Loader2, Check, Music, Sparkles } from 'lucide-react';
import type { CampaignVideo, MediaFolder } from '../../../types/videos';
import './VideoCard.css';

interface VideoCardProps {
  video: CampaignVideo;
  isDownloading: boolean;
  onDownload: (video: CampaignVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isDownloading,
  onDownload
}) => {
  const folder: MediaFolder = video.folder || 'videos';
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Controle de reprodução para vídeos
  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setHasPlayedOnce(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Controle de reprodução para áudio/música
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleDownloadClick = async () => {
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
      {/* Máscara 1:1 solicitada pelo usuário para ocupar pouco espaço */}
      <div className={`video-mask-1x1 ${folder}`}>
        {folder === 'videos' && (
          <>
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.posterUrl}
              preload="metadata"
              playsInline
              controls={hasPlayedOnce}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="video-element-cover"
              onClick={togglePlayVideo}
            />

            {!isPlaying && (
              <button
                type="button"
                className="video-play-overlay-btn"
                aria-label="Reproduzir vídeo"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayVideo();
                }}
              >
                <Play size={26} fill="currentColor" />
              </button>
            )}
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
          </div>
        )}

        {folder === 'musica' && (
          <div className="audio-preview-wrapper" onClick={togglePlayAudio}>
            <audio
              ref={audioRef}
              src={video.videoUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
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
              aria-label={isPlaying ? 'Pausar áudio' : 'Ouvir áudio'}
              onClick={(e) => {
                e.stopPropagation();
                togglePlayAudio();
              }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
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
