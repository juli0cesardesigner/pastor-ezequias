import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type {
  AgendaEvent,
  AgendaEventInput,
  AgendaPriority,
  AgendaSessionUser,
} from '../../../types/agenda';
import { InlineMonthCalendar } from './InlineMonthCalendar';
import { DateTextInput } from './DateTextInput';

interface AgendaImportantDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: AgendaEventInput, editingId?: number) => Promise<void>;
  editingEvent: AgendaEvent | null;
  currentUser: AgendaSessionUser;
  defaultDate?: string;
  dayEventsMap?: Record<string, { type: 'compromisso' | 'data_importante' }[]>;
}

export const AgendaImportantDateModal: React.FC<AgendaImportantDateModalProps> = ({
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

  // 1. Título
  const [title, setTitle] = useState('');

  // 2. Data
  const [date, setDate] = useState(defaultDate || getTodayString());

  // 3. Classificação (Normal / Importante / Nunca Esquecer)
  const [priority, setPriority] = useState<AgendaPriority>('media');

  // 4. Toggle Recorrência
  const [enableRecurrence, setEnableRecurrence] = useState(true);
  const [recurrence, setRecurrence] = useState<'none' | 'anual' | 'mensal'>('anual');

  // 4. Toggle Lembrete
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(1);

  // 5. Toggle Detalhes
  const [enableDetails, setEnableDetails] = useState(false);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDate(editingEvent.eventDate);
      setPriority(editingEvent.priority || 'media');
      setNotes(editingEvent.notes || '');
      setEnableDetails(Boolean(editingEvent.notes && editingEvent.notes.trim()));
      setEnableRecurrence(true);
      setRecurrence('anual');
      const hasReminderNote = editingEvent.notes && editingEvent.notes.includes('[Aviso:');
      setEnableReminder(Boolean(hasReminderNote));
    } else {
      setTitle('');
      setDate(defaultDate || getTodayString());
      setPriority('media');
      setNotes('');
      setEnableDetails(false);
      setEnableRecurrence(true);
      setRecurrence('anual');
      setEnableReminder(false);
      setReminderDays(1);
    }
    setErrorMsg(null);
  }, [editingEvent, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Informe o nome da data importante.');
      return;
    }
    if (!date) {
      setErrorMsg('Selecione uma data.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const finalNotes = enableReminder && reminderDays > 0
        ? `${notes.trim() ? notes.trim() + '\n' : ''}[Aviso: ${reminderDays} dia(s) antes]`
        : notes.trim();

      const input: AgendaEventInput = {
        eventDate: date,
        eventTime: 'Dia Todo',
        title: title.trim(),
        location: '',
        notes: enableDetails ? finalNotes : (enableReminder ? `[Aviso: ${reminderDays} dia(s) antes]` : ''),
        status: 'confirmado',
        priority: priority,
        eventType: 'data_importante',
        recurrence: !editingEvent && enableRecurrence ? recurrence : 'none',
        createdByName: editingEvent ? editingEvent.createdByName : currentUser.name,
        createdByUserId: editingEvent ? editingEvent.createdByUserId : currentUser.id,
      };

      await onSave(input, editingEvent?.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar a data importante.');
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
              id="important-title"
              type="text"
              className="agenda-title-large-input"
              placeholder="Data Importante..."
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

          {/* 3. CLASSIFICAÇÃO DA DATA */}
          <div className="agenda-classification-group">
            <span className="agenda-classification-label">Classificação:</span>
            <div className="agenda-classification-pills">
              <button
                type="button"
                className={`classification-pill pill-green ${priority === 'baixa' ? 'active' : ''}`}
                onClick={() => setPriority('baixa')}
              >
                <span className="pill-dot green" />
                <span>Normal</span>
              </button>

              <button
                type="button"
                className={`classification-pill pill-yellow ${priority === 'media' ? 'active' : ''}`}
                onClick={() => setPriority('media')}
              >
                <span className="pill-dot yellow" />
                <span>Importante</span>
              </button>

              <button
                type="button"
                className={`classification-pill pill-red ${priority === 'urgente' || priority === 'alta' ? 'active' : ''}`}
                onClick={() => setPriority('urgente')}
              >
                <span className="pill-dot red" />
                <span>Nunca Esquecer</span>
              </button>
            </div>
          </div>

          {/* 4. [DATA] (SEM HORA) */}
          <div className="agenda-datetime-row">
            <div className="datetime-col full">
              <DateTextInput value={date} onChange={setDate} />
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
                    <option value="anual">Todo ano (Anual)</option>
                    <option value="mensal">Todo mês (Mensal)</option>
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
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="agenda-clean-input"
                >
                  <option value={1}>1 dia antes</option>
                  <option value={0}>No próprio dia</option>
                  <option value={3}>3 dias antes</option>
                  <option value={7}>1 semana antes</option>
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
              className="btn-agenda-save gold"
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
      </div>
    </div>
  );
};
