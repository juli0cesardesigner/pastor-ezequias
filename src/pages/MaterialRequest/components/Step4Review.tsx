import React from 'react';
import { ArrowLeft, Send, Loader2, Edit3, Package, User, MapPin, AlertTriangle } from 'lucide-react';
import type { SelectedMaterialItem, SupporterInfo, DeliveryAddress } from '../../../types/materials';
import type { WizardStep } from '../../../hooks/useMaterialOrder';

interface Step4ReviewProps {
  selectedItems: SelectedMaterialItem[];
  totalItemCount: number;
  supporter: SupporterInfo;
  address: DeliveryAddress;
  isSubmitting: boolean;
  stepError: string | null;
  onGoToStep: (step: WizardStep) => void;
  onPrev: () => void;
  onSubmit: () => void;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  selectedItems,
  totalItemCount,
  supporter,
  address,
  isSubmitting,
  stepError,
  onGoToStep,
  onPrev,
  onSubmit
}) => {
  return (
    <div className="wizard-screen animate-fade-in">
      <div className="screen-header">
        <h3 className="screen-title">4. Resumo e Confirmação</h3>
        <p className="screen-subtitle">Revise seus dados antes de enviar a solicitação</p>
      </div>

      <div className="review-cards-list">
        {/* Card 1: Materiais */}
        <div className="review-card">
          <div className="review-card-top">
            <div className="review-title-tag">
              <Package size={16} className="text-gold" />
              <span>Materiais Selecionados ({totalItemCount})</span>
            </div>
            <button type="button" className="btn-review-edit" onClick={() => onGoToStep(1)}>
              <Edit3 size={13} />
              <span>Alterar</span>
            </button>
          </div>
          <ul className="review-items-list">
            {selectedItems.map((item) => (
              <li key={item.id}>
                <strong>{item.quantity}x</strong> {item.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Card 2: Contato */}
        <div className="review-card">
          <div className="review-card-top">
            <div className="review-title-tag">
              <User size={16} className="text-gold" />
              <span>Dados de Contato</span>
            </div>
            <button type="button" className="btn-review-edit" onClick={() => onGoToStep(2)}>
              <Edit3 size={13} />
              <span>Alterar</span>
            </button>
          </div>
          <div className="review-text-content">
            <p><strong>Nome:</strong> {supporter.name}</p>
            <p><strong>WhatsApp:</strong> {supporter.whatsapp}</p>
            {supporter.notes && <p><strong>Obs:</strong> {supporter.notes}</p>}
          </div>
        </div>

        {/* Card 3: Endereço */}
        <div className="review-card">
          <div className="review-card-top">
            <div className="review-title-tag">
              <MapPin size={16} className="text-gold" />
              <span>Endereço de Entrega</span>
            </div>
            <button type="button" className="btn-review-edit" onClick={() => onGoToStep(3)}>
              <Edit3 size={13} />
              <span>Alterar</span>
            </button>
          </div>
          <div className="review-text-content">
            <p>{address.street}, Nº {address.number}{address.complement ? ` - ${address.complement}` : ''}</p>
            <p>{address.neighborhood} • {address.city}/{address.state} • CEP {address.cep}</p>
            {address.referencePoint && <p className="review-ref"><strong>Ref:</strong> {address.referencePoint}</p>}
          </div>
        </div>
      </div>

      {stepError && (
        <div className="wizard-error-banner" role="alert">
          <AlertTriangle size={16} />
          <span>{stepError}</span>
        </div>
      )}

      <div className="review-footer-action">
        <div className="wizard-action-row">
          <button type="button" className="btn-wizard-prev" onClick={onPrev} disabled={isSubmitting}>
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            className="btn-wizard-submit"
            onClick={onSubmit}
            disabled={isSubmitting || selectedItems.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Enviando Pedido...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Confirmar e Solicitar Materiais</span>
              </>
            )}
          </button>
        </div>

        <p className="clean-disclaimer">
          ✓ 100% Gratuito • Campanha Oficial Pastor Ezequias
        </p>
      </div>
    </div>
  );
};
