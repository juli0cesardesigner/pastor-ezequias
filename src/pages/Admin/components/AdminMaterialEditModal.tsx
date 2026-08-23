import React, { useState } from 'react';
import { X, Image as ImageIcon, Save, Package } from 'lucide-react';
import type { MaterialCatalogItem } from '../../../types/materials';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    const success = await onSave(formData);
    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card admin-edit-card">
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
              placeholder="Ex: Adesivo Redondo / Praguinha"
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
              placeholder="Ex: Adesivo de alta qualidade para camisa ou carro"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">
              <ImageIcon size={14} />
              URL da Imagem / Prévia
            </label>
            <input
              type="url"
              className="form-input"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {formData.imageUrl && (
              <div className="image-preview-box">
                <img src={formData.imageUrl} alt="Prévia" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div className="form-group half-width">
            <label className="form-label">Tag / Destaque (Badge)</label>
            <input
              type="text"
              className="form-input"
              value={formData.badgeText || ''}
              onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              placeholder="Ex: Mais Pedido"
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
                <label className="form-label">Quantidade Máxima Permitida *</label>
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
            <button type="submit" className="btn-primary-action" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
