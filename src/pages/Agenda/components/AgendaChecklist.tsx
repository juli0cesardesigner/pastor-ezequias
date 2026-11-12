import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  CheckCircle2,
  ListTodo,
  CalendarClock,
  X,
} from 'lucide-react';
import type { AgendaTask, AgendaEvent, AgendaPriority } from '../../../types/agenda';

interface AgendaChecklistProps {
  tasks: AgendaTask[];
  events: AgendaEvent[];
  isLoading?: boolean;
  onToggleComplete: (task: AgendaTask) => void;
  onEdit: (task: AgendaTask) => void;
  onDelete: (task: AgendaTask) => void;
  onQuickCreate: (title: string) => Promise<void>;
  onOpenNewModal: () => void;
}

export const AgendaChecklist: React.FC<AgendaChecklistProps> = ({
  tasks,
  events,
  isLoading = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onQuickCreate,
  onOpenNewModal,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pendentes' | 'concluidas' | 'todas'>('pendentes');
  const [searchTerm, setSearchTerm] = useState('');

  // Mapeamento rápido de ID de evento para título e data para fácil lookup
  const eventMap = useMemo(() => {
    const map = new Map<number, AgendaEvent>();
    for (const ev of events) {
      map.set(ev.id, ev);
    }
    return map;
  }, [events]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const formatDateBR = (ymd?: string | null) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  // Contadores
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  // Filtragem
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filtro de status
      if (statusFilter === 'pendentes' && task.completed) return false;
      if (statusFilter === 'concluidas' && !task.completed) return false;

      // Filtro de busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(term);
        const matchesNotes = task.notes ? task.notes.toLowerCase().includes(term) : false;
        const matchesEvent = task.eventTitle ? task.eventTitle.toLowerCase().includes(term) : false;
        if (!matchesTitle && !matchesNotes && !matchesEvent) return false;
      }

      return true;
    }).sort((a, b) => {
      // Pendentes primeiro
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;

      // Por prioridade urgente/alta
      const pWeights: Record<AgendaPriority, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };
      const pDiff = (pWeights[b.priority || 'media'] || 2) - (pWeights[a.priority || 'media'] || 2);
      if (pDiff !== 0) return pDiff;

      // Se tiver data de compromisso ou atribuída
      if (a.assignedDate && b.assignedDate) {
        return a.assignedDate.localeCompare(b.assignedDate);
      }
      if (a.assignedDate && !b.assignedDate) return -1;
      if (!a.assignedDate && b.assignedDate) return 1;

      return b.id - a.id;
    });
  }, [tasks, statusFilter, searchTerm]);

  // Envio rápido de pendência
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickTitle.trim();
    if (!clean || isSubmittingQuick) return;

    setIsSubmittingQuick(true);
    try {
      await onQuickCreate(clean);
      setQuickTitle('');
    } catch (err) {
      console.error('Erro ao adicionar pendência rápida:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  return (
    <div className="agenda-checklist-screen">
      {/* 1. Barra de Adição Rápida e Botão Nova Pendência */}
      <div className="checklist-quick-bar">
        <form onSubmit={handleQuickSubmit} className="checklist-quick-form">
          <input
            type="text"
            className="checklist-quick-input"
            placeholder="Nova pendência rápida..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            disabled={isSubmittingQuick}
          />
          <button
            type="submit"
            className="checklist-quick-submit-btn"
            disabled={!quickTitle.trim() || isSubmittingQuick}
            title="Adicionar rápida"
            aria-label="Adicionar"
          >
            <Plus size={18} />
          </button>
        </form>
        <button
          type="button"
          className="checklist-detailed-btn"
          onClick={onOpenNewModal}
          title="Criar pendência detalhada"
        >
          <span>+ Nova</span>
        </button>
      </div>

      {/* 2. Filtros de Status (Pendentes | Concluídas | Todas) com contadores integrados */}
      <div className="checklist-status-tabs">
        <button
          type="button"
          className={`status-tab ${statusFilter === 'pendentes' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pendentes')}
        >
          <span>Pendentes</span>
          <span className="tab-count">{pendingCount}</span>
        </button>
        <button
          type="button"
          className={`status-tab ${statusFilter === 'concluidas' ? 'active' : ''}`}
          onClick={() => setStatusFilter('concluidas')}
        >
          <span>Concluídas</span>
          <span className="tab-count">{completedCount}</span>
        </button>
        <button
          type="button"
          className={`status-tab ${statusFilter === 'todas' ? 'active' : ''}`}
          onClick={() => setStatusFilter('todas')}
        >
          <span>Todas</span>
          <span className="tab-count">{totalCount}</span>
        </button>
      </div>

      {/* Campo de Busca Rápida de Pendências */}
      {tasks.length > 3 && (
        <div className="checklist-search-box">
          <Search size={15} className="checklist-search-icon" />
          <input
            type="text"
            className="checklist-search-input"
            placeholder="Buscar em pendências..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="checklist-search-clear"
              onClick={() => setSearchTerm('')}
              title="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Lista de Itens do Checklist */}
      <div className="checklist-items-container">
        {isLoading && tasks.length === 0 ? (
          <div className="agenda-dates-empty">
            <p>Carregando pendências...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="agenda-dates-empty">
            <div className="empty-icon-wrap checklist-empty-icon">
              {statusFilter === 'concluidas' ? (
                <CheckCircle2 size={36} className="text-agenda-green" />
              ) : (
                <ListTodo size={36} className="text-agenda-muted" />
              )}
            </div>
            <p>
              {tasks.length === 0
                ? 'Nenhuma pendência cadastrada.'
                : statusFilter === 'pendentes'
                ? 'Nenhuma pendência em aberto!'
                : 'Nenhuma pendência encontrada para este filtro.'}
            </p>
            <span className="empty-sub">
              {tasks.length === 0
                ? 'Use o campo acima ou toque em "+ Detalhado" para adicionar tarefas e checklists.'
                : 'Tudo em dia! Bom trabalho.'}
            </span>
          </div>
        ) : (
          <div className="checklist-cards-list">
            {filteredTasks.map((task) => {
              const linkedEvent = task.agendaEventId ? eventMap.get(task.agendaEventId) : null;
              const displayEventTitle = task.eventTitle || linkedEvent?.title || null;
              const isDateOverdue =
                !task.completed && task.assignedDate && task.assignedDate < todayStr;
              const isDateToday = task.assignedDate === todayStr;

              return (
                <div
                  key={task.id}
                  className={`checklist-item-card ${task.completed ? 'is-completed' : ''} priority-${task.priority}`}
                >
                  {/* Botão de Checkbox Interativo */}
                  <button
                    type="button"
                    className={`checklist-checkbox-btn ${task.completed ? 'checked' : ''}`}
                    onClick={() => onToggleComplete(task)}
                    title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                    aria-label={task.completed ? 'Desmarcar' : 'Concluir'}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={22} className="check-icon checked" />
                    ) : (
                      <div className="custom-empty-checkbox" />
                    )}
                  </button>

                  {/* Conteúdo Principal da Tarefa */}
                  <div className="checklist-item-body">
                    <div className="checklist-item-header">
                      <span className={`checklist-item-title ${task.completed ? 'strike' : ''}`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Tags e Vínculos */}
                    <div className="checklist-badges-wrap">
                      {/* Badge de Compromisso Vinculado */}
                      {task.agendaEventId && (
                        <span className="checklist-badge badge-event">
                          <Calendar size={12} />
                          <span>{displayEventTitle || 'Compromisso'}</span>
                          {linkedEvent?.eventTime && linkedEvent.eventTime !== 'Dia Todo' && (
                            <span className="badge-time">({linkedEvent.eventTime})</span>
                          )}
                        </span>
                      )}

                      {/* Badge de Data Atribuída (quando não for apenas do compromisso ou além dele) */}
                      {task.assignedDate && !task.agendaEventId && (
                        <span
                          className={`checklist-badge badge-date ${
                            isDateOverdue ? 'overdue' : isDateToday ? 'today' : ''
                          }`}
                        >
                          <CalendarClock size={12} />
                          <span>{formatDateBR(task.assignedDate)}</span>
                          {isDateToday && <span className="badge-tag today">Hoje</span>}
                          {isDateOverdue && <span className="badge-tag overdue">Atrasado</span>}
                        </span>
                      )}

                      {/* Badge de Item Avulso (Sem Data nem Compromisso) */}
                      {!task.assignedDate && !task.agendaEventId && (
                        <span className="checklist-badge badge-standalone">
                          <span>⚡ A Fazer</span>
                        </span>
                      )}

                      {/* Tag de Prioridade */}
                      {task.priority && task.priority !== 'media' && (
                        <span className={`checklist-badge badge-priority priority-${task.priority}`}>
                          {task.priority === 'urgente'
                            ? 'Urgente'
                            : task.priority === 'alta'
                            ? 'Alta'
                            : 'Baixa'}
                        </span>
                      )}
                    </div>

                    {/* Observações / Notas */}
                    {task.notes && task.notes.trim() && (
                      <p className="checklist-item-notes">{task.notes}</p>
                    )}
                  </div>

                  {/* Ações: Editar e Excluir */}
                  <div className="checklist-item-actions">
                    <button
                      type="button"
                      className="checklist-action-btn edit"
                      onClick={() => onEdit(task)}
                      title="Editar pendência"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="checklist-action-btn delete"
                      onClick={() => onDelete(task)}
                      title="Excluir pendência"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
