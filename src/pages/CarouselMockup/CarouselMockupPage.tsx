import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import './CarouselMockupPage.css';

interface CarouselSlide {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
}

export const CarouselMockupPage: React.FC = () => {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const touchStartXRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ordenação natural de arquivos (001.png, 002.png ou slide-1, slide-2)
  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    const mediaFiles = rawFiles.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (mediaFiles.length === 0) return;

    // Ordenação alfanumérica natural
    const sortedFiles = mediaFiles.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    // Revoga URLs anteriores para liberar memória
    slides.forEach(slide => URL.revokeObjectURL(slide.url));

    const newSlides: CarouselSlide[] = sortedFiles.map(file => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      name: file.name,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file)
    }));

    setSlides(newSlides);
    setCurrentIndex(0);
  }, [slides]);

  // Limpa URLs criadas ao desmontar
  useEffect(() => {
    return () => {
      slides.forEach(slide => URL.revokeObjectURL(slide.url));
    };
  }, [slides]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  // Suporte a swipe no mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const onDragLeave = () => {
    setIsDraggingOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`carousel-mockup-page theme-${theme}`}>
      {/* Input invisível para upload - acionado pelo atalho do clique no avatar ou dropzone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden-file-input"
        onChange={e => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* Se não houver slides carregados: Dropzone amigável */}
      {slides.length === 0 ? (
        <div
          className={`carousel-empty-dropzone ${isDraggingOver ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="carousel-empty-icon" />
          <h3>Arraste os arquivos do carrossel aqui</h3>
          <p>
            Suporta imagens (.png, .jpg, .webp) e vídeos (.mp4). A ordenação automática é feita pelo nome do arquivo.
          </p>
        </div>
      ) : (
        /* Card Mockup Estilo Feed Instagram */
        <article
          className="insta-post-card"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Header do Post */}
          <div className="insta-header">
            <div className="insta-header-user">
              {/* Foto de perfil com atalho de clique oculto para trocar arquivos */}
              <img
                src="/foto.webp"
                alt="Pr. Ezequias Sousa"
                className="insta-avatar"
                title="Clique para trocar arquivos"
                onClick={() => fileInputRef.current?.click()}
              />
              <div className="insta-user-texts">
                <div className="insta-username-row">
                  <span className="insta-username">ezequiassousa</span>
                  <span className="insta-verified-badge" title="Verificado">
                    <Check size={8} strokeWidth={4} />
                  </span>
                </div>
                <span className="insta-location">Colatina, Espírito Santo</span>
              </div>
            </div>

            <div className="insta-header-actions">
              <button type="button" className="insta-follow-btn">Seguir</button>
              {/* Alternador de tema discreto */}
              <button
                type="button"
                className="insta-theme-toggle-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Alternar para fundo claro' : 'Alternar para fundo escuro'}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <MoreHorizontal size={18} className="insta-more-btn" />
            </div>
          </div>

          {/* Área do Carrossel (Aspect Ratio 4:5) */}
          <div
            className="insta-carousel-viewport"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Badge numérico de lâminas (Ex: 1/10) */}
            <div className="insta-slide-badge">
              {currentIndex + 1}/{slides.length}
            </div>

            {/* Setas de navegação desktop */}
            {currentIndex > 0 && (
              <button
                type="button"
                className="insta-nav-arrow insta-nav-prev"
                onClick={handlePrev}
                aria-label="Slide anterior"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {currentIndex < slides.length - 1 && (
              <button
                type="button"
                className="insta-nav-arrow insta-nav-next"
                onClick={handleNext}
                aria-label="Próximo slide"
              >
                <ChevronRight size={18} />
              </button>
            )}

            {/* Trilho dos Slides */}
            <div
              className="insta-slide-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map(slide => (
                <div key={slide.id} className="insta-slide-item">
                  {slide.type === 'video' ? (
                    <video
                      src={slide.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="insta-slide-media"
                    />
                  ) : (
                    <img
                      src={slide.url}
                      alt={slide.name}
                      className="insta-slide-media"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ações & Engajamento: Mockup Fixo */}
          <div className="insta-actions-bar">
            <div className="insta-left-actions">
              <Heart size={22} className="insta-action-icon" />
              <MessageCircle size={22} className="insta-action-icon" />
              <Send size={22} className="insta-action-icon" />
            </div>

            {/* Indicador de Bolinhas (Bullets) */}
            <div className="insta-dots">
              {slides.map((_, idx) => (
                <span
                  key={idx}
                  className={`insta-dot ${idx === currentIndex ? 'active' : ''}`}
                />
              ))}
            </div>

            <Bookmark size={22} className="insta-action-icon" />
          </div>

          {/* Conteúdo Fixo do Rodapé / Legenda */}
          <div className="insta-footer-content">
            <div className="insta-likes">Curtido por apoiadores e outras pessoas</div>
            <div className="insta-caption">
              <span className="insta-caption-user">ezequiassousa</span>
              <span className="insta-caption-text">
                arrasta pro lado! 👉
              </span>
            </div>
            <time className="insta-time-ago">HÁ 2 HORAS</time>
          </div>
        </article>
      )}
    </div>
  );
};
