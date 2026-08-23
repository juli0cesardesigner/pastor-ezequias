import React from 'react';
import { ArrowRight, ArrowLeft, Search, Loader2, AlertTriangle } from 'lucide-react';
import type { DeliveryAddress } from '../../../types/materials';

interface Step3AddressProps {
  address: DeliveryAddress;
  isSearchingCep: boolean;
  stepError: string | null;
  onChange: (address: DeliveryAddress) => void;
  onCepBlur: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3Address: React.FC<Step3AddressProps> = ({
  address,
  isSearchingCep,
  stepError,
  onChange,
  onCepBlur,
  onNext,
  onPrev
}) => {
  const formatCep = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange({ ...address, cep: formatted });
  };

  return (
    <div className="wizard-screen animate-fade-in">
      <div className="screen-header">
        <h3 className="screen-title">3. Endereço de Entrega</h3>
        <p className="screen-subtitle">Informe o local para envio gratuito dos seus materiais</p>
      </div>

      <div className="form-fields-stack">
        <div className="field-block cep-field-block">
          <label htmlFor="stepCepInput" className="clean-label">CEP *</label>
          <div className="cep-input-group">
            <input
              id="stepCepInput"
              type="text"
              className="clean-input"
              placeholder="00000-000"
              value={address.cep}
              onChange={handleCepChange}
              onBlur={onCepBlur}
              required
            />
            <button
              type="button"
              className="btn-cep-search"
              onClick={onCepBlur}
              disabled={isSearchingCep}
            >
              {isSearchingCep ? <Loader2 className="spinner" size={14} /> : <Search size={14} />}
              <span>Buscar CEP</span>
            </button>
          </div>
        </div>

        <div className="field-block">
          <label htmlFor="stepStreetInput" className="clean-label">Rua / Logradouro *</label>
          <input
            id="stepStreetInput"
            type="text"
            className="clean-input"
            placeholder="Nome da rua ou avenida"
            value={address.street}
            onChange={(e) => onChange({ ...address, street: e.target.value })}
            required
          />
        </div>

        <div className="form-row-2col">
          <div className="field-block">
            <label htmlFor="stepNumberInput" className="clean-label">Número *</label>
            <input
              id="stepNumberInput"
              type="text"
              className="clean-input"
              placeholder="Ex: 120"
              value={address.number}
              onChange={(e) => onChange({ ...address, number: e.target.value })}
              required
            />
          </div>

          <div className="field-block">
            <label htmlFor="stepCompInput" className="clean-label">Complemento</label>
            <input
              id="stepCompInput"
              type="text"
              className="clean-input"
              placeholder="Apto, Bloco, etc."
              value={address.complement || ''}
              onChange={(e) => onChange({ ...address, complement: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row-3col">
          <div className="field-block flex-2">
            <label htmlFor="stepNeighInput" className="clean-label">Bairro *</label>
            <input
              id="stepNeighInput"
              type="text"
              className="clean-input"
              placeholder="Bairro"
              value={address.neighborhood}
              onChange={(e) => onChange({ ...address, neighborhood: e.target.value })}
              required
            />
          </div>

          <div className="field-block flex-2">
            <label htmlFor="stepCityInput" className="clean-label">Cidade *</label>
            <input
              id="stepCityInput"
              type="text"
              className="clean-input"
              placeholder="Cidade"
              value={address.city}
              onChange={(e) => onChange({ ...address, city: e.target.value })}
              required
            />
          </div>

          <div className="field-block flex-1 uf-block">
            <label htmlFor="stepStateInput" className="clean-label">UF *</label>
            <input
              id="stepStateInput"
              type="text"
              className="clean-input text-center"
              placeholder="ES"
              maxLength={2}
              value={address.state}
              onChange={(e) => onChange({ ...address, state: e.target.value.toUpperCase() })}
              required
            />
          </div>
        </div>

        <div className="field-block">
          <label htmlFor="stepRefInput" className="clean-label">Ponto de Referência (Opcional)</label>
          <input
            id="stepRefInput"
            type="text"
            className="clean-input"
            placeholder="Ex: Próximo à padaria central / portão azul"
            value={address.referencePoint || ''}
            onChange={(e) => onChange({ ...address, referencePoint: e.target.value })}
          />
        </div>
      </div>

      {stepError && (
        <div className="wizard-error-banner" role="alert">
          <AlertTriangle size={16} />
          <span>{stepError}</span>
        </div>
      )}

      <div className="wizard-action-row">
        <button type="button" className="btn-wizard-prev" onClick={onPrev}>
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>

        <button type="button" className="btn-wizard-next" onClick={onNext}>
          <span>Avançar para Resumo</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
