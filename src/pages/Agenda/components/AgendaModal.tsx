import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Tag, AlertCircle, FileText, CheckCircle2, Star, User, Repeat } from 'lucide-react';
import type { AgendaEvent, AgendaEventInput, AgendaPriority, AgendaStatus, AgendaSessionUser, AgendaEventType } from '../../../types/agenda';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';
import { CustomDropdown } from './CustomDropdown';

const priorityModalOptions = [
  { value: 'baixa', label: 'Baixa Prioridade', colorDot: '#10b981' },
  { value: 'media', label: 'Média Prioridade', colorDot: '#3b82f6' },
  { value: 'alta', label: 'Alta Prioridade', colorDot: '#f59e0b' },
  { value: 'urgente', label: 'Urgente / Decisivo', colorDot: '#ef4444' },
];

const statusModalOptions = [
  { value: 'pendente', label: 'Pendente / A Confirmar', colorDot: '#f59e0b' },
  { value: 'confirmado', label: 'Confirmado', colorDot: '#10b981' },
  { value: 'em_andamento', label: 'Em Andamento', colorDot: '#8b5cf6' },
  { value: 'concluido', label: 'Concluído', colorDot: '#64748b' },
  { value: 'cancelado', label: 'Cancelado', colorDot: '#ef4444' },
];

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: AgendaEventInput, editingId?: number) => Promise<void>;
  editingEvent: AgendaEvent | null;
  currentUser: AgendaSessionUser;
  defaultDate?: string;
  defaultEventType?: AgendaEventType;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  currentUser,
  defaultDate,
  defaultEventType = 'compromisso',
}) => {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [eventType, setEventType] = useState<AgendaEventType>(defaultEventType || 'compromisso');
  const [date, setDate] = useState(defaultDate || getTodayString());
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<AgendaPriority>('media');
  const [status, setStatus] = useState<AgendaStatus>('pendente');
  const [notes, setNotes] = useState('');
  
  // Recurrence states
  const [recurrence, setRecurrence] = useState<'none' | 'semanal' | 'mensal' | 'anual'>('none');
  const [recurrenceLimit, setRecurrenceLimit] = useState<'sem_limite' | 'data_especifica'>('sem_limite');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingEvent) {
      setEventType(editingEvent.eventType || 'compromisso');
      setDate(editingEvent.eventDate);
      setTime(editingEvent.eventTime || '09:00');
      setTitle(editingEvent.title);
      setLocation(editingEvent.location);
      setPriority(editingEvent.priority);
      setStatus(editingEvent.status);
      setNotes(editingEvent.notes);
      // Ao editar, não permitimos alterar repetição em lote nesta versão simples
      setRecurrence('none');
      setRecurrenceLimit('sem_limite');
      setRecurrenceEndDate('');
    } else {
      setEventType(defaultEventType || 'compromisso');
      setDate(defaultDate || getTodayString());
      setTime('09:00');
      setTitle('');
      setLocation('');
      setPriority('media');
      setStatus('pendente');
      setNotes('');
      setRecurrence('none');
      setRecurrenceLimit('sem_limite');
      setRecurrenceEndDate('');
    }
    setErrorMsg(null);
  }, [editingEvent, defaultDate, defaultEventType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(
        eventType === 'data_importante'
          ? 'O título da data importante é obrigatório.'
          : 'O título do compromisso é obrigatório.'
      );
      return;
    }
    if (!date) {
      setErrorMsg('A data é obrigatória.');
      return;
    }
    if (eventType === 'compromisso' && !time) {
      setErrorMsg('O horário é obrigatório para compromissos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const input: AgendaEventInput = {
        eventDate: date,
        eventTime: eventType === 'data_importante' ? 'Dia Todo' : time,
        title: title.trim(),
        location: location.trim(),
        notes: notes.trim(),
        status: eventType === 'data_importante' ? 'confirmado' : status,
        priority: eventType === 'data_importante' ? 'alta' : priority,
        eventType,
        recurrence: !editingEvent ? recurrence : 'none',
        recurrenceEndDate: !editingEvent && recurrenceLimit === 'data_especifica' ? recurrenceEndDate : undefined,
        createdByName: editingEvent ? editingEvent.createdByName : currentUser.name,
        createdByUserId: editingEvent ? editingEvent.createdByUserId : currentUser.id,
      };

      await onSave(input, editingEvent?.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="agenda-modal-overlay" onClick={onClose}>
      <div className="agenda-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="agenda-modal-header">
          <div className="agenda-modal-title-wrap">
            {eventType === 'data_importante' ? (
              <Star className="text-gold" size={22} />
            ) : (
              <Calendar className="text-gold" size={22} />
            )}
            <h3>
              {editingEvent
                ? (editingEvent.eventType === 'data_importante' ? 'Editar Data Importante' : 'Editar Compromisso')
                : (eventType === 'data_importante' ? 'Nova Data Importante' : 'Novo Compromisso')}
            </h3>
          </div>
          <button type="button" className="agenda-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="agenda-modal-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="agenda-modal-form">
          {eventType === 'data_importante' ? (
            <div className="agenda-form-group">
              <label>
                <Calendar size={14} /> Data do Marco ou Comemoração *
              </label>
              <CustomDatePicker value={date} onChange={setDate} />
              <span className="form-hint-text">
                ⭐️ Esta data terá destaque exclusivo no topo do dia e sinalização dourada no calendário.
              </span>
            </div>
          ) : (
            <div className="agenda-form-row">
              <div className="agenda-form-group flex-1">
                <label>
                  <Calendar size={14} /> Data *
                </label>
                <CustomDatePicker value={date} onChange={setDate} />
              </div>

              <div className="agenda-form-group flex-1">
                <label>
                  <Clock size={14} /> Horário *
                </label>
                <CustomTimePicker value={time} onChange={setTime} />
              </div>
            </div>
          )}

          <div className="agenda-form-group">
            <label htmlFor="agenda-title">
              <FileText size={14} />{' '}
              {eventType === 'data_importante'
                ? 'Título do Marco / Data Importante *'
                : 'Título do Compromisso *'}
            </label>
            <input
              id="agenda-title"
              type="text"
              placeholder={
                eventType === 'data_importante'
                  ? 'Ex: Início do Horário Eleitoral, Aniversário do Pastor, Convenção...'
                  : 'Ex: Culto de Santa Ceia, Reunião com Lideranças, Almoço...'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="agenda-form-group">
            <label htmlFor="agenda-location">
              <MapPin size={14} /> Local / Cidade (Opcional)
            </label>
            <input
              id="agenda-location"
              type="text"
              placeholder="Ex: Cariacica, Vitória, Grande Vitória ou local específico"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {eventType === 'compromisso' && (
            <div className="agenda-form-row">
              <div className="agenda-form-group flex-1">
                <label>
                  <Tag size={14} /> Prioridade
                </label>
                <CustomDropdown
                  value={priority}
                  onChange={(val) => setPriority(val as AgendaPriority)}
                  options={priorityModalOptions}
                />
              </div>

              <div className="agenda-form-group flex-1">
                <label>
                  <CheckCircle2 size={14} /> Status
                </label>
                <CustomDropdown
                  value={status}
                  onChange={(val) => setStatus(val as AgendaStatus)}
                  options={statusModalOptions}
                />
              </div>
            </div>
          )}

          {!editingEvent && (
            <div className="agenda-form-row">
              <div className="agenda-form-group flex-1">
                <label>
                  <Repeat size={14} /> Repetição
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  className="agenda-modal-input"
                >
                  <option value="none">Não repete</option>
                  <option value="semanal">Semanalmente</option>
                  <option value="mensal">Mensalmente</option>
                  <option value="anual">Anualmente</option>
                </select>
              </div>

              {recurrence !== 'none' && (
                <div className="agenda-form-group flex-1">
                  <label>Término</label>
                  <select
                    value={recurrenceLimit}
                    onChange={(e) => {
                      setRecurrenceLimit(e.target.value as any);
                      if (e.target.value === 'sem_limite') setRecurrenceEndDate('');
                    }}
                    className="agenda-modal-input"
                  >
                    <option value="sem_limite">Sem Limite</option>
                    <option value="data_especifica">Até uma data</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {!editingEvent && recurrence !== 'none' && recurrenceLimit === 'data_especifica' && (
            <div className="agenda-form-group">
              <label>Data de Término da Repetição *</label>
              <CustomDatePicker value={recurrenceEndDate} onChange={setRecurrenceEndDate} />
            </div>
          )}

          <div className="agenda-form-group">
            <label htmlFor="agenda-notes">
              <FileText size={14} /> Pauta / Anotações Operacionais
            </label>
            <textarea
              id="agenda-notes"
              rows={3}
              placeholder="Observações da comitiva, pessoas de contato, demandas locais, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="agenda-modal-author-badge">
            <User size={14} className="text-gold" />
            <span>Criado por: <strong>{editingEvent ? editingEvent.createdByName : currentUser.name}</strong></span>
          </div>

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
              {isSubmitting
                ? 'Salvando...'
                : editingEvent
                ? 'Salvar Alterações'
                : eventType === 'data_importante'
                ? 'Cadastrar Data Importante'
                : 'Cadastrar Compromisso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
