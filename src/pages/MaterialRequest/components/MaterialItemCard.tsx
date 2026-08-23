import React, { useState } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import type { MaterialCatalogItem } from '../../../types/materials';

interface MaterialItemCardProps {
  item: MaterialCatalogItem;
  quantity: number;
  onQuantityChange: (id: string, delta: number) => void;
}

export const MaterialItemCard: React.FC<MaterialItemCardProps> = ({
  item,
  quantity,
  onQuantityChange
}) => {
  const [imgError, setImgError] = useState(false);
  const isMaxReached = item.hasLimit && quantity >= item.maxQuantity;

  return (
    <div className={`mat-row ${quantity > 0 ? 'selected' : ''}`}>
      <div className="mat-main-info">
        <div className="mat-icon-wrap">
          {item.imageUrl && !imgError ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              onError={() => setImgError(true)}
              className="mat-img"
            />
          ) : (
            <Package size={18} className="mat-fallback-icon" />
          )}
        </div>

        <div className="mat-text-box">
          <span className="mat-name">{item.name}</span>
          {item.hasLimit && (
            <span className="mat-limit">Máx: {item.maxQuantity} un.</span>
          )}
        </div>
      </div>

      <div className="mat-stepper">
        <button
          type="button"
          className="step-btn minus"
          onClick={() => onQuantityChange(item.id, -1)}
          disabled={quantity <= 0}
          aria-label={`Diminuir ${item.name}`}
        >
          <Minus size={15} />
        </button>

        <span className="step-count">{quantity}</span>

        <button
          type="button"
          className="step-btn plus"
          onClick={() => onQuantityChange(item.id, 1)}
          disabled={isMaxReached}
          aria-label={`Aumentar ${item.name}`}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
};
