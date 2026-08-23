import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Save, Package } from 'lucide-react';
import { AdminMaterialEditModal } from './AdminMaterialEditModal';
import type { MaterialCatalogItem } from '../../../types/materials';

interface AdminCatalogSettingsTabProps {
  catalog: MaterialCatalogItem[];
  whatsappNumber: string;
  isSavingSetting: boolean;
  onSaveItem: (item: MaterialCatalogItem) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<void>;
  onSaveWhatsapp: (phone: string) => Promise<void>;
}

export const AdminCatalogSettingsTab: React.FC<AdminCatalogSettingsTabProps> = ({
  catalog,
  whatsappNumber,
  isSavingSetting,
  onSaveItem,
  onDeleteItem,
  onSaveWhatsapp
}) => {
  const [editingItem, setEditingItem] = useState<MaterialCatalogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>(whatsappNumber);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MaterialCatalogItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="admin-tab-content">
      {/* WhatsApp Configuration Flat Section */}
      <div className="admin-section-flat">
        <div className="section-flat-header">
          <div className="setting-title-wrap">
            <Phone size={18} className="text-gold" />
            <div>
              <h3 className="section-flat-title">WhatsApp da Coordenação</h3>
              <p className="section-flat-subtitle">Número de destino para notificações da campanha</p>
            </div>
          </div>
        </div>

        <div className="setting-form-row">
          <input
            type="text"
            className="clean-input setting-phone-input"
            placeholder="5527999999999 (com DDI e DDD)"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-save-setting"
            onClick={() => onSaveWhatsapp(phoneInput)}
            disabled={isSavingSetting}
          >
            <Save size={15} />
            <span>{isSavingSetting ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Catalog Management Flat Section */}
      <div className="admin-section-flat">
        <div className="section-flat-header space-between">
          <div className="setting-title-wrap">
            <Package size={18} className="text-gold" />
            <div>
              <h3 className="section-flat-title">Catálogo de Materiais</h3>
              <p className="section-flat-subtitle">Cadastre e configure materiais, limites e visibilidade</p>
            </div>
          </div>

          <button type="button" className="btn-add-material" onClick={handleOpenAdd}>
            <Plus size={15} />
            <span>Novo Material</span>
          </button>
        </div>

        <div className="admin-catalog-flat-list">
          {catalog.map((item) => (
            <div key={item.id} className={`admin-material-row-flat ${item.isActive ? '' : 'inactive'}`}>
              <div className="admin-row-thumb">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <Package size={20} className="text-gold" />
                )}
              </div>

              <div className="admin-row-info">
                <div className="admin-row-title-line">
                  <h4 className="admin-row-name">{item.name}</h4>
                  {item.badgeText && <span className="admin-card-badge">{item.badgeText}</span>}
                </div>
                {item.description && <p className="admin-row-desc">{item.description}</p>}
                
                <div className="admin-row-meta">
                  <span className="limit-info">
                    {item.hasLimit ? `Máx: ${item.maxQuantity} un.` : 'Sem limite'}
                  </span>
                  <span className={`status-pill ${item.isActive ? 'active' : 'hidden'}`}>
                    {item.isActive ? '• Visível' : '• Oculto'}
                  </span>
                </div>
              </div>

              <div className="admin-row-actions">
                <button type="button" className="btn-edit-item" onClick={() => handleOpenEdit(item)} title="Editar">
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>
                <button type="button" className="btn-delete-item" onClick={() => onDeleteItem(item.id)} title="Excluir">
                  <Trash2 size={14} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <AdminMaterialEditModal
          item={editingItem}
          onSave={onSaveItem}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
