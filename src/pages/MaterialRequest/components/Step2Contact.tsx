import React from 'react';
import { ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { SupporterInfo } from '../../../types/materials';

interface Step2ContactProps {
  supporter: SupporterInfo;
  stepError: string | null;
  onChange: (supporter: SupporterInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2Contact: React.FC<Step2ContactProps> = ({
  supporter,
  stepError,
  onChange,
  onNext,
  onPrev
}) => {
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange({ ...supporter, whatsapp: formatted });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div className="wizard-screen animate-fade-in" onKeyDown={handleKeyDown}>
      <div className="screen-header">
        <h3 className="screen-title">2. Seus Dados de Contato</h3>
        <p className="screen-subtitle">Informe como podemos falar com você sobre a entrega</p>
      </div>

      <div className="form-fields-stack">
        <div className="field-block">
          <label htmlFor="stepNameInput" className="clean-label">Nome Completo *</label>
          <input
            id="stepNameInput"
            type="text"
            className="clean-input"
            placeholder="Digite seu nome completo"
            value={supporter.name}
            onChange={(e) => onChange({ ...supporter, name: e.target.value })}
            autoFocus
            required
          />
        </div>

        <div className="field-block">
          <label htmlFor="stepPhoneInput" className="clean-label">WhatsApp com DDD *</label>
          <input
            id="stepPhoneInput"
            type="tel"
            className="clean-input"
            placeholder="(27) 99999-9999"
            value={supporter.whatsapp}
            onChange={handlePhoneChange}
            required
          />
        </div>

        <div className="field-block">
          <label htmlFor="stepNotesInput" className="clean-label">Observações (Opcional)</label>
          <input
            id="stepNotesInput"
            type="text"
            className="clean-input"
            placeholder="Ex: Entregar em horário comercial, recado para vizinho..."
            value={supporter.notes || ''}
            onChange={(e) => onChange({ ...supporter, notes: e.target.value })}
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
          <span>Avançar para Endereço</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
