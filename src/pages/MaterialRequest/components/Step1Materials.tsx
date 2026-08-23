import React from 'react';
import { ArrowRight, AlertTriangle, Loader2, Package } from 'lucide-react';
import { MaterialItemCard } from './MaterialItemCard';
import type { MaterialCatalogItem, SelectedMaterialItem } from '../../../types/materials';

interface Step1MaterialsProps {
  catalog: MaterialCatalogItem[];
  quantities: Record<string, number>;
  selectedItems: SelectedMaterialItem[];
  totalItemCount: number;
  isLoading: boolean;
  stepError: string | null;
  onQuantityChange: (id: string, delta: number) => void;
  onNext: () => void;
}

export const Step1Materials: React.FC<Step1MaterialsProps> = ({
  catalog,
  quantities,
  totalItemCount,
  isLoading,
  stepError,
  onQuantityChange,
  onNext
}) => {
  if (isLoading) {
    return (
      <div className="wizard-screen-loading">
        <Loader2 className="spinner" size={24} />
        <span>Carregando materiais disponíveis...</span>
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <div className="wizard-screen-empty">
        <Package size={32} />
        <span>Nenhum material disponível no momento.</span>
      </div>
    );
  }

  return (
    <div className="wizard-screen animate-fade-in">
      <div className="screen-header">
        <h3 className="screen-title">1. Escolha os Materiais</h3>
        <p className="screen-subtitle">Selecione as quantidades que deseja receber</p>
      </div>

      <div className="mat-list-container">
        {catalog.map((item) => (
          <MaterialItemCard
            key={item.id}
            item={item}
            quantity={quantities[item.id] || 0}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </div>

      {stepError && (
        <div className="wizard-error-banner" role="alert">
          <AlertTriangle size={16} />
          <span>{stepError}</span>
        </div>
      )}

      <div className="wizard-action-row single">
        <button
          type="button"
          className="btn-wizard-next"
          onClick={onNext}
          disabled={totalItemCount === 0}
        >
          <span>Avançar para Contato ({totalItemCount})</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
