import React, { useState, useEffect } from 'react';
import {
  X,
  Film,
  Image as ImageIcon,
  Music,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { parseWixVideoUrl } from '../../../utils/wixVideoParser';
import type { CampaignVideo, MediaFolder } from '../../../types/videos';
import './AdminVideoModal.css';

interface AdminVideoModalProps {
  video: CampaignVideo | null;
  initialFolder?: MediaFolder;
  onSave: (
    video: Partial<CampaignVideo> & { id: string; title: string; videoUrl: string }
  ) => Promise<boolean>;
  onClose: () => void;
}

export const AdminVideoModal: React.FC<AdminVideoModalProps> = ({
  video,
  initialFolder = 'videos',
  onSave,
  onClose
}) => {
  const isEditing = Boolean(video);

  const [folder, setFolder] = useState<MediaFolder>(video?.folder || initialFolder);
  const [rawUrlInput, setRawUrlInput] = useState<string>(
    video?.rawWixUrl || video?.videoUrl || ''
  );
  const [title, setTitle] = useState<string>(video?.title || '');
  const [displayOrder, setDisplayOrder] = useState<number>(video?.displayOrder ?? 0);
  const [isActive, setIsActive] = useState<boolean>(video?.isActive ?? true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Parse dinâmico em tempo real enquanto o usuário digita/cola o link do Wix
  const parsed = parseWixVideoUrl(rawUrlInput);

  useEffect(() => {
    // Se o usuário ainda não digitou título e colou um link com nome de arquivo, sugere título limpo
    if (!title && parsed.suggestedFileName && parsed.suggestedFileName !== 'midia') {
      const cleanSuggestion = parsed.suggestedFileName
        .replace(/\.(mp4|jpg|jpeg|png|webp|mp3|wav)$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      if (cleanSuggestion) {
        setTitle(cleanSuggestion);
      }
    }
  }, [parsed.suggestedFileName, title]);

  useEffect(() => {
    if (!isEditing && parsed.detectedFolder) {
      setFolder(parsed.detectedFolder);
    }
  }, [parsed.detectedFolder, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!rawUrlInput.trim()) {
      setFormError('Por favor, informe o link da mídia fornecido pelo Wix ou link direto.');
      return;
    }

    if (!parsed.videoUrl) {
      setFormError('Link inválido. Cole a URL do Wix ou o link direto do arquivo.');
      return;
    }

    if (!title.trim()) {
      setFormError('Por favor, defina a legenda/título da mídia.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: video ? video.id : `med_${Date.now()}`,
        title: title.trim(),
        videoUrl: parsed.videoUrl,
        posterUrl: parsed.posterUrl || video?.posterUrl || undefined,
        rawWixUrl: rawUrlInput.trim(),
        folder,
        displayOrder: Number(displayOrder) || 0,
        isActive,
        downloadCount: video?.downloadCount ?? 0
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      } else {
        setFormError('Erro ao salvar no banco de dados. Tente novamente.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar mídia';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-video-modal-backdrop" onClick={onClose}>
      <div
        className="admin-video-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header do Modal */}
        <div className="modal-header">
          <div className="modal-header-title">
            <Film size={20} className="text-gold" />
            <h2>{isEditing ? 'Editar Mídia da Campanha' : 'Adicionar Nova Mídia'}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="modal-error-banner">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Seletor de Pasta / Folder */}
          <div className="form-group">
            <label className="form-label">
              Pasta de Destino <span className="required">*</span>
            </label>
            <div className="modal-folder-selector">
              <button
                type="button"
                className={`folder-select-btn ${folder === 'videos' ? 'selected' : ''}`}
                onClick={() => setFolder('videos')}
              >
                <Film size={15} />
                <span>Vídeos</span>
              </button>

              <button
                type="button"
                className={`folder-select-btn ${folder === 'imagens' ? 'selected' : ''}`}
                onClick={() => setFolder('imagens')}
              >
                <ImageIcon size={15} />
                <span>Imagens</span>
              </button>

              <button
                type="button"
                className={`folder-select-btn ${folder === 'musica' ? 'selected' : ''}`}
                onClick={() => setFolder('musica')}
              >
                <Music size={15} />
                <span>Música</span>
              </button>

              <button
                type="button"
                className={`folder-select-btn ${folder === 'figurinhas' ? 'selected' : ''}`}
                onClick={() => setFolder('figurinhas')}
              >
                <Sparkles size={15} />
                <span>Figurinhas</span>
              </button>
            </div>
          </div>

          {/* Campo: Link do Wix ou Direto */}
          <div className="form-group">
            <label className="form-label" htmlFor="wix-url-input">
              Link da Mídia no Wix ou URL Direta <span className="required">*</span>
            </label>
            <textarea
              id="wix-url-input"
              rows={2}
              className="form-textarea"
              placeholder="Cole wix:video://..., wix:image://... ou link direto https://..."
              value={rawUrlInput}
              onChange={(e) => setRawUrlInput(e.target.value)}
              required
            />
            <span className="form-helper">
              Aceita links internos do Wix ou URLs diretas. O sistema converte automaticamente.
            </span>
          </div>

          {/* Preview em tempo real da URL convertida e da Capa */}
          {parsed.videoUrl && (
            <div className="wix-parsed-preview">
              <div className="parsed-badge">
                <CheckCircle2 size={14} className="text-emerald" />
                <span>Link detectado com sucesso</span>
              </div>

              <div className="preview-row">
                {parsed.posterUrl || (folder === 'imagens' && parsed.videoUrl) ? (
                  <div className="poster-preview-box">
                    <img
                      src={parsed.posterUrl || parsed.videoUrl}
                      alt="Prévia detectada"
                      className="poster-img"
                    />
                    <span className="poster-badge">Preview</span>
                  </div>
                ) : folder === 'musica' ? (
                  <div className="poster-preview-box placeholder audio">
                    <Music size={24} className="text-gold" />
                    <span>Áudio MP3</span>
                  </div>
                ) : (
                  <div className="poster-preview-box placeholder">
                    <Eye size={20} />
                    <span>Sem poster</span>
                  </div>
                )}

                <div className="preview-details">
                  <div className="preview-label">URL Direta do Arquivo:</div>
                  <div className="preview-url-text" title={parsed.videoUrl}>
                    {parsed.videoUrl}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campo: Legenda / Título (centralizada dentro do box) */}
          <div className="form-group">
            <label className="form-label" htmlFor="video-title">
              Legenda / Título da Mídia <span className="required">*</span>
            </label>
            <input
              id="video-title"
              type="text"
              className="form-input"
              placeholder="Ex: MESSIAS - Deputado Estadual"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <span className="form-helper">
              Esta legenda será exibida centralizada na parte inferior do box 1:1.
            </span>
          </div>

          {/* Linha Dupla: Ordem e Status */}
          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label" htmlFor="video-order">
                Ordem Prioritária (Opcional)
              </label>
              <input
                id="video-order"
                type="number"
                min="0"
                className="form-input"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              />
              <span className="form-helper">Por padrão, a exibição é do mais novo para o mais antigo.</span>
            </div>

            <div className="form-group checkbox-group">
              <label className="form-label">Visibilidade</label>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="toggle-slider" />
                <span className="toggle-text">
                  {isActive ? 'Ativo (Visível no site)' : 'Oculto (Rascunho)'}
                </span>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit-save"
              disabled={isSaving || !rawUrlInput.trim()}
            >
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Mídia'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
