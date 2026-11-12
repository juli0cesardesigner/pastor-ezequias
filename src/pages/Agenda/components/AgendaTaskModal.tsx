import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlertCircle, Calendar } from 'lucide-react';
import type {
  AgendaTask,
  AgendaTaskInput,
  AgendaSessionUser,
  AgendaEvent,
  AgendaPriority,
} from '../../../types/agenda';
import { IosDatePickerModal } from './IosTimePickerModal';

interface AgendaTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskInput: AgendaTaskInput, editingTaskId?: number) => Promise<void>;
  editingTask: AgendaTask | null;
  currentUser: AgendaSessionUser;
  defaultDate?: string;
  events?: AgendaEvent[];
}

export const AgendaTaskModal: React.FC<AgendaTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  currentUser,
  defaultDate,
  events = [],
}) => {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [title, setTitle] = useState('');
  const [assignmentType, setAssignmentType] = useState<'standalone' | 'date' | 'event'>('standalone');
  const [assignedDate, setAssignedDate] = useState(defaultDate || getTodayString());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [agendaEventId, setAgendaEventId] = useState<number | null>(null);
  const [priority, setPriority] = useState<AgendaPriority>('media');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatDateBR = (ymd: string) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editingTask) {
      setTitle(editingTask.title);
      setPriority(editingTask.priority || 'media');
      setNotes(editingTask.notes || '');

      if (editingTask.agendaEventId) {
        setAssignmentType('event');
        setAgendaEventId(editingTask.agendaEventId);
        setAssignedDate(editingTask.assignedDate || defaultDate || getTodayString());
      } else if (editingTask.assignedDate) {
        setAssignmentType('date');
        setAssignedDate(editingTask.assignedDate);
        setAgendaEventId(null);
      } else {
        setAssignmentType('standalone');
        setAssignedDate(defaultDate || getTodayString());
        setAgendaEventId(null);
      }
    } else {
      setTitle('');
      setPriority('media');
      setNotes('');
      if (defaultDate) {
        setAssignmentType('date');
        setAssignedDate(defaultDate);
      } else {
        setAssignmentType('standalone');
        setAssignedDate(getTodayString());
      }
      setAgendaEventId(null);
    }
    setErrorMsg(null);
  }, [editingTask, isOpen, defaultDate]);

  if (!isOpen) return null;

  const availableEvents = events
    .filter((e) => e.status !== 'cancelado')
    .sort((a, b) => {
      const dCmp = a.eventDate.localeCompare(b.eventDate);
      if (dCmp !== 0) return dCmp;
      return (a.eventTime || '').localeCompare(b.eventTime || '');
    });

  const handleSelectEvent = (eventIdStr: string) => {
    const id = Number(eventIdStr);
    if (!id) {
      setAgendaEventId(null);
      return;
    }
    setAgendaEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev && ev.eventDate) {
      setAssignedDate(ev.eventDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Informe o que precisa ser feito.');
      return;
    }

    if (assignmentType === 'event' && !agendaEventId) {
      setErrorMsg('Selecione o compromisso da agenda.');
      return;
    }

    if (assignmentType === 'date' && !assignedDate) {
      setErrorMsg('Informe a data da pendência.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: AgendaTaskInput = {
        title: title.trim(),
        completed: editingTask ? editingTask.completed : false,
        priority,
        notes: notes.trim(),
        assignedDate: assignmentType === 'standalone' ? null : assignedDate,
        agendaEventId: assignmentType === 'event' ? agendaEventId : null,
        createdByName: currentUser.name || 'Equipe',
        createdByUserId: currentUser.id,
      };

      await onSave(payload, editingTask ? editingTask.id : undefined);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar pendência:', err);
      setErrorMsg(err.message || 'Não foi possível salvar a pendência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="agenda-fullscreen-modal-overlay">
      <div className="agenda-fullscreen-modal-container">
        {/* Topbar Fixa Padronizada */}
        <div className="agenda-fullscreen-topbar">
          <div className="topbar-title-group">
            <CheckSquare size={24} className="topbar-icon emerald" />
            <h2>{editingTask ? 'Editar Pendência' : 'Nova Pendência'}</h2>
          </div>
          <button
            type="button"
            className="agenda-fullscreen-close-btn"
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

        <form onSubmit={handleSubmit} className="agenda-ultra-clean-form">
          {/* 1. TÍTULO GRANDE LIMPO */}
          <div className="agenda-clean-item">
            <input
              id="task-title"
              type="text"
              className="agenda-title-large-input"
              placeholder="O que precisa ser feito?..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* 2. TIPO DE ORGANIZAÇÃO (3 BOTÕES) */}
          <div className="agenda-clean-item">
            <label className="agenda-clean-section-label">Como organizar:</label>
            <div className="checklist-type-selector">
              <button
                type="button"
                className={`checklist-type-btn ${assignmentType === 'standalone' ? 'active' : ''}`}
                onClick={() => setAssignmentType('standalone')}
              >
                <span className="checklist-type-icon">⚡</span>
                <div className="checklist-type-text">
                  <span className="checklist-type-label">Apenas a Fazer</span>
                  <span className="checklist-type-sub">Sem data definida</span>
                </div>
              </button>

              <button
                type="button"
                className={`checklist-type-btn ${assignmentType === 'date' ? 'active' : ''}`}
                onClick={() => {
                  setAssignmentType('date');
                  setIsDatePickerOpen(true);
                }}
              >
                <span className="checklist-type-icon">🗓️</span>
                <div className="checklist-type-text">
                  <span className="checklist-type-label">Por Data</span>
                  <span className="checklist-type-sub">Dia específico</span>
                </div>
              </button>

              <button
                type="button"
                className={`checklist-type-btn ${assignmentType === 'event' ? 'active' : ''}`}
                onClick={() => setAssignmentType('event')}
              >
                <span className="checklist-type-icon">📅</span>
                <div className="checklist-type-text">
                  <span className="checklist-type-label">Compromisso</span>
                  <span className="checklist-type-sub">Vinculado a evento</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. CAMPO DINÂMICO: DATA COM WHEEL PICKER ESTILO IPHONE */}
          {assignmentType === 'date' && (
            <div className="agenda-clean-item checklist-subfield-fade">
              <label className="agenda-clean-section-label">Data da Pendência:</label>
              <button
                type="button"
                className="date-picker-trigger-btn"
                onClick={() => setIsDatePickerOpen(true)}
              >
                <span className="date-picker-display-val">{formatDateBR(assignedDate)}</span>
                <Calendar size={18} className="text-agenda-muted" />
              </button>
            </div>
          )}

          {/* 4. CAMPO DINÂMICO: COMPROMISSO DA AGENDA */}
          {assignmentType === 'event' && (
            <div className="agenda-clean-item checklist-subfield-fade">
              <label className="agenda-clean-section-label">Selecione o Compromisso:</label>
              {availableEvents.length === 0 ? (
                <div className="checklist-no-events-alert">
                  <AlertCircle size={16} />
                  <span>Nenhum compromisso cadastrado para vincular.</span>
                </div>
              ) : (
                <select
                  id="task-event-select"
                  className="agenda-clean-select"
                  value={agendaEventId || ''}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  required
                >
                  <option value="">Selecione um compromisso da agenda...</option>
                  {availableEvents.map((ev) => {
                    const dateFormatted = ev.eventDate.includes('-')
                      ? ev.eventDate.split('-').reverse().join('/')
                      : ev.eventDate;
                    const time = ev.eventTime && ev.eventTime !== 'Dia Todo' ? ` às ${ev.eventTime}` : '';
                    return (
                      <option key={ev.id} value={ev.id}>
                        {dateFormatted}{time} — {ev.title} {ev.location ? `(${ev.location})` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* 5. PRIORIDADE (PILLS PADRÃO DO SISTEMA) */}
          <div className="agenda-classification-group">
            <span className="agenda-classification-label">Prioridade:</span>
            <div className="agenda-classification-pills">
              <button
                type="button"
                className={`classification-pill pill-green ${priority === 'baixa' ? 'active' : ''}`}
                onClick={() => setPriority('baixa')}
              >
                <span className="pill-dot green" />
                <span>Baixa</span>
              </button>

              <button
                type="button"
                className={`classification-pill pill-blue ${priority === 'media' ? 'active' : ''}`}
                onClick={() => setPriority('media')}
              >
                <span className="pill-dot blue" />
                <span>Média</span>
              </button>

              <button
                type="button"
                className={`classification-pill pill-yellow ${priority === 'alta' ? 'active' : ''}`}
                onClick={() => setPriority('alta')}
              >
                <span className="pill-dot yellow" />
                <span>Alta</span>
              </button>

              <button
                type="button"
                className={`classification-pill pill-red ${priority === 'urgente' ? 'active' : ''}`}
                onClick={() => setPriority('urgente')}
              >
                <span className="pill-dot red" />
                <span>Urgente</span>
              </button>
            </div>
          </div>

          {/* 6. ANOTAÇÕES / DETALHES (OPCIONAL) */}
          <div className="agenda-clean-item">
            <label className="agenda-clean-section-label">Anotações / Detalhes (opcional):</label>
            <textarea
              id="task-notes"
              className="agenda-clean-textarea"
              rows={3}
              placeholder="Instruções adicionais, contatos, materiais necessários..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* 7. RODAPÉ FIXO COM BOTÕES PADRÃO */}
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
              className="btn-agenda-save emerald"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Salvando...'
                : editingTask
                ? 'Salvar'
                : 'Salvar'}
            </button>
          </div>
        </form>

        {/* Seletor Wheel Estilo iPhone para Data */}
        <IosDatePickerModal
          isOpen={isDatePickerOpen}
          value={assignedDate}
          onChange={(newDate) => setAssignedDate(newDate)}
          onClose={() => setIsDatePickerOpen(false)}
        />
      </div>
    </div>
  );
};
