import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { MaterialCatalogItem } from '../../../types/materials';

interface MaterialImageModalProps {
  item: MaterialCatalogItem | null;
  onClose: () => void;
}

export const MaterialImageModal: React.FC<MaterialImageModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item || !item.imageUrl) return null;

  return (
    <div className="mat-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="mat-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Visualização de ${item.name}`}
      >
        <button
          type="button"
          className="mat-modal-close-btn"
          onClick={onClose}
          aria-label="Fechar visualização"
        >
          <X size={20} />
        </button>

        <div className="mat-modal-img-wrap">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="mat-modal-img"
          />
        </div>

        <div className="mat-modal-footer">
          <h4 className="mat-modal-title">{item.name}</h4>
          {item.hasLimit && (
            <span className="mat-modal-limit">Limite máximo: {item.maxQuantity} unidades</span>
          )}
        </div>
      </div>
    </div>
  );
};
