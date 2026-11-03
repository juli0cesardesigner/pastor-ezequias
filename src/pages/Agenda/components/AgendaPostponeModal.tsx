import React, { useState, useEffect } from 'react';
import { CalendarClock, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import type { AgendaEvent } from '../../../types/agenda';
import { InlineMonthCalendar } from './InlineMonthCalendar';
import { IosTimePickerModal } from './IosTimePickerModal';

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
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
      setNewTime(event.eventTime && event.eventTime !== 'Dia Todo' ? event.eventTime : '09:00');
      setReason('');
      setErrorMsg(null);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  // Formata data de YYYY-MM-DD para DD/MM/AAAA
  const formatDateBR = (ymd: string) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
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
    <div className="agenda-centered-modal-overlay" onClick={onClose}>
      <div className="agenda-centered-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="agenda-modal-header">
          <div className="agenda-modal-title-wrap">
            <CalendarClock className="text-gold" size={22} />
            <h3>Adiar Compromisso</h3>
          </div>
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
            Data atual: <strong>{formatDateBR(event.eventDate)}</strong> {event.eventTime && event.eventTime !== 'Dia Todo' ? `às ${event.eventTime}` : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="agenda-modal-form">
          {/* Nova Data e Novo Horário (Estilo iPhone Alarm) */}
          <div className="agenda-form-row">
            <div className="agenda-form-group flex-1">
              <label>Nova Data *</label>
              <button
                type="button"
                className="agenda-clean-input time-picker-trigger-btn flex items-center justify-between"
                onClick={() => setIsCalendarOpen(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={16} className="text-agenda-primary" style={{ color: '#3b82f6' }} />
                  <span>{formatDateBR(newDate) || 'Selecionar data'}</span>
                </div>
              </button>
            </div>

            <div className="agenda-form-group flex-1">
              <label>Novo Horário *</label>
              <button
                type="button"
                className="agenda-clean-input time-picker-trigger-btn"
                onClick={() => setIsTimePickerOpen(true)}
              >
                {newTime}
              </button>
            </div>
          </div>

          {/* Motivo do Adiamento */}
          <div className="agenda-form-group">
            <label htmlFor="postpone-reason">Motivo do Adiamento (Opcional)</label>
            <input
              id="postpone-reason"
              type="text"
              placeholder="Ex: Imprevisto na comitiva, reunião urgente..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Ações do Modal */}
          <div className="agenda-modal-actions">
            <button
              type="button"
              className="btn-agenda-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-agenda-save"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Confirmando...' : 'Confirmar'}</span>
            </button>
          </div>
        </form>

        {/* Popup / Modal do Calendário para Escolha da Nova Data */}
        {isCalendarOpen && (
          <div className="agenda-calendar-popup-overlay" onClick={() => setIsCalendarOpen(false)}>
            <div className="agenda-calendar-popup-container" onClick={(e) => e.stopPropagation()}>
              <div className="agenda-calendar-popup-header">
                <span className="agenda-calendar-popup-title">Selecionar Nova Data</span>
                <button
                  type="button"
                  className="agenda-calendar-popup-close-btn"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Concluir
                </button>
              </div>
              <InlineMonthCalendar
                value={newDate}
                onChange={(dateYMD) => {
                  setNewDate(dateYMD);
                  setIsCalendarOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Modal de Horário estilo Alarme iPhone 24h Infinito */}
        <IosTimePickerModal
          isOpen={isTimePickerOpen}
          value={newTime}
          onChange={(val) => setNewTime(val)}
          onClose={() => setIsTimePickerOpen(false)}
        />
      </div>
    </div>
  );
};
