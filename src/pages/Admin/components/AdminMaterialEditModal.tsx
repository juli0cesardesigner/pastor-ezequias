import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Save,
  Package,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { compressAndOptimizeImage } from '../../../services/imageOptimizer';
import type { MaterialCatalogItem } from '../../../types/materials';
import './AdminMaterialEditModal.css';

interface AdminMaterialEditModalProps {
  item: MaterialCatalogItem | null;
  onSave: (item: MaterialCatalogItem) => Promise<boolean>;
  onClose: () => void;
}

export const AdminMaterialEditModal: React.FC<AdminMaterialEditModalProps> = ({
  item,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<MaterialCatalogItem>(
    item || {
      id: `mat_${Date.now()}`,
      name: '',
      description: '',
      imageUrl: '',
      badgeText: '',
      hasLimit: true,
      maxQuantity: 10,
      isActive: true,
      displayOrder: 0
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [useUrlMode, setUseUrlMode] = useState<boolean>(
    Boolean(item?.imageUrl && item.imageUrl.startsWith('http'))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setImageError(null);
    setIsProcessingImage(true);
    try {
      const optimizedDataUrl = await compressAndOptimizeImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85
      });
      setFormData((prev) => ({ ...prev, imageUrl: optimizedDataUrl }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar imagem';
      setImageError(msg);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    const success = await onSave(formData);
    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card admin-edit-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-header-title">
            <Package size={20} className="text-gold" />
            <h3>{item ? 'Editar Material' : 'Adicionar Novo Material'}</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-material-form">
          <div className="form-group full-width">
            <label className="form-label">Nome do Material *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Adesivo de Carro / Parachoque"
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Descrição Breve</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Adesivo vinílico de alta durabilidade e resistente a sol e chuva"
            />
          </div>

          {/* Upload de Imagem Interativo */}
          <div className="form-group full-width">
            <label className="form-label">
              <ImageIcon size={15} className="text-gold" />
              <span>Foto / Prévia do Material</span>
            </label>

            <div className="image-upload-wrapper">
              {!useUrlMode ? (
                <>
                  {formData.imageUrl ? (
                    <div className="image-preview-card">
                      <div className="preview-thumb-wrap">
                        <img src={formData.imageUrl} alt="Prévia" />
                      </div>
                      <div className="preview-info-wrap">
                        <div className="preview-status">
                          <CheckCircle2 size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                          Imagem Carregada
                        </div>
                        <div className="preview-btn-row">
                          <button
                            type="button"
                            className="btn-change-image"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingImage}
                          >
                            <RefreshCw size={13} className={isProcessingImage ? 'spinner-icon' : ''} />
                            <span>{isProcessingImage ? 'Otimizando...' : 'Trocar Foto'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={handleRemoveImage}
                          >
                            <Trash2 size={13} />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`image-dropzone ${isDragActive ? 'drag-active' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="dropzone-icon-circle">
                        {isProcessingImage ? (
                          <RefreshCw size={24} className="spinner-icon" />
                        ) : (
                          <UploadCloud size={24} />
                        )}
                      </div>
                      <h5 className="dropzone-title">
                        {isProcessingImage ? 'Otimizando imagem...' : 'Clique para enviar a foto ou arraste aqui'}
                      </h5>
                      <p className="dropzone-subtitle">
                        JPG, PNG ou WebP • Otimização e compressão automática
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      className="toggle-url-mode-btn"
                      onClick={() => setUseUrlMode(true)}
                    >
                      <LinkIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Prefere colar um link de imagem (URL)?
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://exemplo.com/foto-adesivo.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="image-preview-card" style={{ marginTop: 4 }}>
                      <div className="preview-thumb-wrap">
                        <img src={formData.imageUrl} alt="Prévia" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      </div>
                      <div className="preview-info-wrap">
                        <button type="button" className="btn-remove-image" onClick={handleRemoveImage}>
                          <Trash2 size={13} />
                          <span>Remover URL</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="toggle-url-mode-btn"
                    onClick={() => setUseUrlMode(false)}
                  >
                    <UploadCloud size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Voltar para Upload de Arquivo direto
                  </button>
                </div>
              )}

              {imageError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: '0.8rem', marginTop: 4 }}>
                  <AlertCircle size={14} />
                  <span>{imageError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group half-width">
            <label className="form-label">Tag de Destaque (Badge opcional)</label>
            <input
              type="text"
              className="form-input"
              value={formData.badgeText || ''}
              onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              placeholder="Ex: Mais Pedido, Popular, Destaque"
            />
          </div>

          <div className="form-group half-width">
            <label className="form-label">Ordem de Exibição</label>
            <input
              type="number"
              className="form-input"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group full-width limit-config-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.hasLimit}
                onChange={(e) => setFormData({ ...formData, hasLimit: e.target.checked })}
              />
              <span>Limitar Quantidade Máxima por Pedido?</span>
            </label>

            {formData.hasLimit && (
              <div className="limit-input-wrap">
                <label className="form-label">Quantidade Máxima Permitida por Apoiador *</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData({ ...formData, maxQuantity: Number(e.target.value) || 1 })}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Exibir este material na página pública (/materiais)</span>
            </label>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary-action" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary-action" disabled={isSaving || isProcessingImage}>
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
