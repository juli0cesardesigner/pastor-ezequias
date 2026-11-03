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
import { IosSinglePickerModal } from './IosTimePickerModal';
import type { AgendaRecurrence } from '../../../types/agenda';

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
  const recurrenceOptions: { label: string; value: AgendaRecurrence }[] = [
    { label: 'Diariamente', value: 'diariamente' },
    { label: 'Segunda a sexta', value: 'segunda_a_sexta' },
    { label: 'Semanal', value: 'semanal' },
    { label: 'Mensal', value: 'mensal' },
    { label: 'Anual', value: 'anual' },
  ];

  const reminderOptions: string[] = [
    'Na hora',
    '5 min antes',
    '10 min antes',
    '15 min antes',
    '1h antes',
    '2h antes',
    '1 dia antes',
    '2 dias antes',
    '1 semana antes',
    '2 semanas antes',
  ];

  const getRecurrenceLabel = (val: AgendaRecurrence) => {
    const found = recurrenceOptions.find((opt) => opt.value === val);
    return found ? found.label : 'Anual';
  };

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
  const [recurrence, setRecurrence] = useState<AgendaRecurrence>('anual');
  const [isRecurrencePickerOpen, setIsRecurrencePickerOpen] = useState(false);

  // 5. Toggle Lembrete
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderLabel, setReminderLabel] = useState('1 dia antes');
  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false);

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
      if (hasReminderNote) {
        const match = editingEvent.notes.match(/\[Aviso:\s*(.*?)\]/);
        if (match && match[1]) {
          setReminderLabel(match[1].trim());
        }
      }
    } else {
      setTitle('');
      setDate(defaultDate || getTodayString());
      setPriority('media');
      setNotes('');
      setEnableDetails(false);
      setEnableRecurrence(true);
      setRecurrence('anual');
      setEnableReminder(false);
      setReminderLabel('1 dia antes');
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
      const finalNotes = enableReminder && reminderLabel
        ? `${notes.trim() ? notes.trim() + '\n' : ''}[Aviso: ${reminderLabel}]`
        : notes.trim();

      const input: AgendaEventInput = {
        eventDate: date,
        eventTime: 'Dia Todo',
        title: title.trim(),
        location: '',
        notes: enableDetails ? finalNotes : (enableReminder ? `[Aviso: ${reminderLabel}]` : ''),
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

          {/* 4. [ ] RECORRÊNCIA - TOGGLE AUTOATIVÁVEL COM IOS WHEEL DRUM */}
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
                  <button
                    type="button"
                    className="agenda-clean-input time-picker-trigger-btn flex items-center justify-between"
                    onClick={() => setIsRecurrencePickerOpen(true)}
                  >
                    <span>{getRecurrenceLabel(recurrence)}</span>
                    <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Alterar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. [ ] LEMBRETE - TOGGLE AUTOATIVÁVEL COM IOS WHEEL DRUM */}
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
                <button
                  type="button"
                  className="agenda-clean-input time-picker-trigger-btn flex items-center justify-between"
                  onClick={() => setIsReminderPickerOpen(true)}
                >
                  <span>{reminderLabel}</span>
                  <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Alterar</span>
                </button>
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
        {/* Seletor Estilo iPhone Wheel Drum para Recorrência */}
        <IosSinglePickerModal
          isOpen={isRecurrencePickerOpen}
          title="Recorrência"
          items={recurrenceOptions.map((o) => o.label)}
          value={getRecurrenceLabel(recurrence)}
          onChange={(lbl) => {
            const found = recurrenceOptions.find((o) => o.label === lbl);
            if (found) setRecurrence(found.value);
          }}
          onClose={() => setIsRecurrencePickerOpen(false)}
          loop={true}
        />

        {/* Seletor Estilo iPhone Wheel Drum para Lembrete */}
        <IosSinglePickerModal
          isOpen={isReminderPickerOpen}
          title="Lembrete"
          items={reminderOptions}
          value={reminderLabel}
          onChange={(val) => setReminderLabel(val)}
          onClose={() => setIsReminderPickerOpen(false)}
          loop={true}
        />
      </div>
    </div>
  );
};
