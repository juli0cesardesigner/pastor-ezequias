import React, { useState, useEffect } from 'react';
import { X, CalendarClock, AlertCircle, FastForward } from 'lucide-react';
import type { AgendaEvent } from '../../../types/agenda';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';

interface AgendaPostponeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AgendaEvent | null;
  onPostpone: (
    eventId: number,
    newDate: string,
    newTime: string,
    reason?: string
  ) => Promise<void>;
}

export const AgendaPostponeModal: React.FC<AgendaPostponeModalProps> = ({
  isOpen,
  onClose,
  event,
  onPostpone,
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      // Por padrão, sugere o dia seguinte
      const curr = new Date(`${event.eventDate}T12:00:00`);
      curr.setDate(curr.getDate() + 1);
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');

      setNewDate(`${y}-${m}-${d}`);
      setNewTime(event.eventTime || '09:00');
      setReason('');
      setErrorMsg(null);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  const addDays = (days: number) => {
    const base = new Date(`${event.eventDate}T12:00:00`);
    base.setDate(base.getDate() + days);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    setNewDate(`${y}-${m}-${d}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setErrorMsg('Por favor selecione a nova data.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onPostpone(event.id, newDate, newTime, reason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adiar compromisso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="agenda-modal-overlay" onClick={onClose}>
      <div className="agenda-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="agenda-modal-header">
          <div className="agenda-modal-title-wrap">
            <CalendarClock className="text-gold" size={22} />
            <h3>Adiar Compromisso</h3>
          </div>
          <button
            type="button"
            className="agenda-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="agenda-modal-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="postpone-event-preview">
          <span className="postpone-preview-label">Compromisso a ser adiado:</span>
          <h4 className="postpone-preview-title">{event.title}</h4>
          <p className="postpone-preview-current">
            Data atual: <strong>{event.eventDate}</strong> {event.eventTime ? `às ${event.eventTime}` : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="agenda-modal-form">
          {/* Atalhos Rápidos de Nova Data */}
          <div className="agenda-form-group">
            <label>Sugestões Rápidas de Nova Data</label>
            <div className="postpone-quick-buttons">
              <button
                type="button"
                className="btn-quick-postpone"
                onClick={() => addDays(1)}
              >
                Amanhã (+1 dia)
              </button>
              <button
                type="button"
                className="btn-quick-postpone"
                onClick={() => addDays(2)}
              >
                +2 Dias
              </button>
              <button
                type="button"
                className="btn-quick-postpone"
                onClick={() => addDays(7)}
              >
                Próxima Semana (+7 dias)
              </button>
            </div>
          </div>

          {/* Seletores de Nova Data e Novo Horário */}
          <div className="agenda-form-row">
            <div className="agenda-form-group flex-1">
              <label>Nova Data *</label>
              <CustomDatePicker value={newDate} onChange={setNewDate} />
            </div>

            <div className="agenda-form-group flex-1">
              <label>Novo Horário *</label>
              <CustomTimePicker value={newTime} onChange={setNewTime} />
            </div>
          </div>

          {/* Motivo do Adiamento */}
          <div className="agenda-form-group">
            <label htmlFor="postpone-reason">Motivo do Adiamento (Opcional)</label>
            <input
              id="postpone-reason"
              type="text"
              placeholder="Ex: Imprevisto na comitiva, reunião urgente, reagendado a pedido..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Ações do Modal */}
          <div className="agenda-modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-submit btn-postpone-confirm"
              disabled={isSubmitting}
            >
              <FastForward size={16} />
              <span>{isSubmitting ? 'Adiado...' : 'Confirmar e Migrar Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
