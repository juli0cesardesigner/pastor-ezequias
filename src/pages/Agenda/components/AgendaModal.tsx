import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type {
  AgendaEvent,
  AgendaEventInput,
  AgendaSessionUser,
} from '../../../types/agenda';
import { InlineMonthCalendar } from './InlineMonthCalendar';
import { DateTextInput } from './DateTextInput';
import { IosTimePickerModal } from './IosTimePickerModal';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: AgendaEventInput, editingId?: number) => Promise<void>;
  editingEvent: AgendaEvent | null;
  currentUser: AgendaSessionUser;
  defaultDate?: string;
  dayEventsMap?: Record<string, { type: 'compromisso' | 'data_importante' }[]>;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  currentUser,
  defaultDate,
  dayEventsMap = {},
}) => {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Título do Compromisso
  const [title, setTitle] = useState('');

  // 2. Data
  const [date, setDate] = useState(defaultDate || getTodayString());

  // 3. Horário
  const [time, setTime] = useState('09:00');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // 4. Toggle Recorrência
  const [enableRecurrence, setEnableRecurrence] = useState(false);
  const [recurrence, setRecurrence] = useState<'none' | 'semanal' | 'mensal' | 'anual'>('semanal');

  // 5. Toggle Lembrete
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number>(30);

  // 6. Toggle Detalhes (Local + Anotações)
  const [enableDetails, setEnableDetails] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDate(editingEvent.eventDate);
      setTime(editingEvent.eventTime || '09:00');
      setLocation(editingEvent.location || '');
      setNotes(editingEvent.notes || '');

      const hasDetails = Boolean((editingEvent.location && editingEvent.location.trim()) || (editingEvent.notes && editingEvent.notes.trim()));
      setEnableDetails(hasDetails);

      setEnableRecurrence(false);
      setRecurrence('none');

      const hasReminderNote = editingEvent.notes && editingEvent.notes.includes('[Lembrete:');
      setEnableReminder(Boolean(hasReminderNote));
    } else {
      setTitle('');
      setDate(defaultDate || getTodayString());
      setTime('09:00');
      setLocation('');
      setNotes('');
      setEnableRecurrence(false);
      setRecurrence('semanal');
      setEnableReminder(false);
      setReminderMinutes(30);
      setEnableDetails(false);
    }
    setErrorMsg(null);
  }, [editingEvent, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Informe o compromisso.');
      return;
    }
    if (!date) {
      setErrorMsg('Selecione uma data.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const finalNotes = enableReminder && reminderMinutes > 0
        ? `${notes.trim() ? notes.trim() + '\n' : ''}[Lembrete: ${reminderMinutes} min antes]`
        : notes.trim();

      const input: AgendaEventInput = {
        eventDate: date,
        eventTime: time,
        title: title.trim(),
        location: enableDetails ? location.trim() : '',
        notes: enableDetails ? finalNotes : (enableReminder ? `[Lembrete: ${reminderMinutes} min antes]` : ''),
        status: 'pendente',
        priority: 'media',
        eventType: 'compromisso',
        recurrence: !editingEvent && enableRecurrence ? recurrence : 'none',
        createdByName: editingEvent ? editingEvent.createdByName : currentUser.name,
        createdByUserId: editingEvent ? editingEvent.createdByUserId : currentUser.id,
      };

      await onSave(input, editingEvent?.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar o compromisso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="agenda-fullscreen-modal-overlay">
      <div className="agenda-fullscreen-modal-container">
        {errorMsg && (
          <div className="agenda-modal-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="agenda-ultra-clean-form">
          {/* 1. TÍTULO */}
          <div className="agenda-clean-item">
            <input
              id="agenda-title"
              type="text"
              className="agenda-title-large-input"
              placeholder="Compromisso..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* 2. CALENDÁRIO MENSUAL (< mes/ano >) */}
          <div className="agenda-clean-item">
            <InlineMonthCalendar
              value={date}
              onChange={setDate}
              dayEventsMap={dayEventsMap}
            />
          </div>

          {/* 3. [DATA] [HORA] NA MESMA LINHA */}
          <div className="agenda-datetime-row">
            <div className="datetime-col">
              <DateTextInput value={date} onChange={setDate} />
            </div>
            <div className="datetime-col">
              <button
                type="button"
                className="agenda-clean-input time-picker-trigger-btn"
                onClick={() => setIsTimePickerOpen(true)}
              >
                {time}
              </button>
            </div>
          </div>

          {/* 4. [ ] RECORRÊNCIA - TOGGLE AUTOATIVÁVEL */}
          {!editingEvent && (
            <div className="agenda-toggle-block">
              <label className="agenda-toggle-trigger">
                <input
                  type="checkbox"
                  checked={enableRecurrence}
                  onChange={(e) => setEnableRecurrence(e.target.checked)}
                />
                <span className="toggle-label-text">Recorrência</span>
              </label>

              {enableRecurrence && (
                <div className="toggle-sub-content">
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="agenda-clean-input"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 5. [ ] LEMBRETE - TOGGLE AUTOATIVÁVEL */}
          <div className="agenda-toggle-block">
            <label className="agenda-toggle-trigger">
              <input
                type="checkbox"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
              />
              <span className="toggle-label-text">Lembrete</span>
            </label>

            {enableReminder && (
              <div className="toggle-sub-content">
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="agenda-clean-input"
                >
                  <option value={0}>No momento</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={120}>2 horas antes</option>
                  <option value={1440}>1 dia antes</option>
                </select>
              </div>
            )}
          </div>

          {/* 6. [ ] DETALHES - TOGGLE AUTOATIVÁVEL */}
          <div className="agenda-toggle-block">
            <label className="agenda-toggle-trigger">
              <input
                type="checkbox"
                checked={enableDetails}
                onChange={(e) => setEnableDetails(e.target.checked)}
              />
              <span className="toggle-label-text">Detalhes</span>
            </label>

            {enableDetails && (
              <div className="toggle-sub-content">
                <input
                  type="text"
                  placeholder="Local..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="agenda-clean-input"
                />
                <textarea
                  rows={3}
                  placeholder="Anotações..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="agenda-clean-input"
                />
              </div>
            )}
          </div>

          {/* Rodapé Fixo */}
          <div className="agenda-fullscreen-actions">
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
              {isSubmitting
                ? 'Salvando...'
                : editingEvent
                ? 'Salvar'
                : 'Salvar'}
            </button>
          </div>
        </form>

        {/* Seletor de Horário no Estilo Alarme do iPhone (24h) */}
        <IosTimePickerModal
          isOpen={isTimePickerOpen}
          value={time}
          onChange={(newTime) => setTime(newTime)}
          onClose={() => setIsTimePickerOpen(false)}
        />
      </div>
    </div>
  );
};
