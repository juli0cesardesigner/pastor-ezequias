import React, { useState } from 'react';
import {
  CalendarClock,
  Edit2,
  Trash2,
  CheckCircle2,
  CheckSquare,
  Plus,
} from 'lucide-react';
import type { AgendaEvent, AgendaTask } from '../../../types/agenda';

interface AgendaTimelineProps {
  events: AgendaEvent[];
  selectedDate?: string;
  onEdit: (event: AgendaEvent) => void;
  onPostpone: (event: AgendaEvent) => void;
  onDelete: (event: AgendaEvent) => void;
  onToggleStatus?: (event: AgendaEvent) => void;
  tasks?: AgendaTask[];
  onToggleTask?: (task: AgendaTask) => void;
  onEditTask?: (task: AgendaTask) => void;
  onDeleteTask?: (task: AgendaTask) => void;
  onNewTaskForDay?: (date: string) => void;
}

const ACCENT_COLORS = ['#4ade80', '#c084fc', '#38bdf8', '#fb7185'];
const IMPORTANT_DATE_COLOR = '#f59e0b';

export const AgendaTimeline: React.FC<AgendaTimelineProps> = ({
  events,
  selectedDate,
  onEdit,
  onPostpone,
  onDelete,
  tasks = [],
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onNewTaskForDay,
}) => {
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  // Filtra as pendências que pertencem a este dia ou aos compromissos deste dia
  const dayEventIds = new Set(events.map((e) => e.id));
  const dayTasks = tasks.filter(
    (t) =>
      (selectedDate && t.assignedDate === selectedDate) ||
      (t.agendaEventId && dayEventIds.has(t.agendaEventId))
  );

  const sortedEvents = [...events].sort((a, b) => {
    if (a.eventType === 'data_importante' && b.eventType !== 'data_importante') return -1;
    if (b.eventType === 'data_importante' && a.eventType !== 'data_importante') return 1;
    return (a.eventTime || '99:99').localeCompare(b.eventTime || '99:99');
  });

  const handleRowClick = (id: number) => {
    setActiveEventId((prev) => (prev === id ? null : id));
  };

  const hasContent = sortedEvents.length > 0 || dayTasks.length > 0;

  if (!hasContent) {
    return (
      <div className="agenda-simple-empty">
        <p>Sem eventos ou pendências para este dia.</p>
        {onNewTaskForDay && selectedDate && (
          <button
            type="button"
            className="agenda-day-add-task-btn"
            onClick={() => onNewTaskForDay(selectedDate)}
          >
            <Plus size={16} />
            <span>Adicionar pendência para este dia</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="agenda-swipe-list">
      {/* Lista de Compromissos e Datas do Dia */}
      {sortedEvents.map((ev, index) => {
        const isActive = activeEventId === ev.id;
        const isImportant = ev.eventType === 'data_importante';
        const color = isImportant ? IMPORTANT_DATE_COLOR : ACCENT_COLORS[index % ACCENT_COLORS.length];

        // Pendências vinculadas a este compromisso específico
        const eventTasks = dayTasks.filter((t) => t.agendaEventId === ev.id);

        return (
          <div
            key={ev.id}
            className={`agenda-swipe-row-container ${isImportant ? 'is-important-date' : ''}`}
          >
            {/* Camada inferior de ações */}
            {isActive && (
              <div className="agenda-swipe-actions-layer">
                <button
                  type="button"
                  className="agenda-swipe-action-btn postpone"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPostpone(ev);
                  }}
                  title="Adiar / Remarcar"
                >
                  <CalendarClock size={20} />
                </button>

                <button
                  type="button"
                  className="agenda-swipe-action-btn edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(ev);
                  }}
                  title="Editar"
                >
                  <Edit2 size={19} />
                </button>

                <button
                  type="button"
                  className="agenda-swipe-action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(ev);
                  }}
                  title="Excluir"
                >
                  <Trash2 size={19} />
                </button>
              </div>
            )}

            {/* Card frontal */}
            <div
              className={`agenda-swipe-card-front ${isActive ? 'is-revealed' : ''}`}
              onClick={() => handleRowClick(ev.id)}
            >
              <span
                className="agenda-swipe-color-bar"
                style={{ backgroundColor: color }}
              />

              <div className="agenda-swipe-info">
                <span
                  className="agenda-swipe-name"
                  style={isImportant ? { color: '#fbbf24' } : undefined}
                >
                  {ev.title}
                </span>
                {ev.location && (
                  <span className="agenda-swipe-sub">{ev.location}</span>
                )}
                {eventTasks.length > 0 && (
                  <span className="agenda-swipe-tasks-counter">
                    <CheckSquare size={12} />
                    {eventTasks.filter((t) => t.completed).length}/{eventTasks.length} pendências feitas
                  </span>
                )}
              </div>

              {!isImportant && ev.eventTime && ev.eventTime !== 'Dia Todo' && (
                <div className="agenda-swipe-time">
                  {ev.eventTime}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Se houver pendências para o dia, exibe a seção de Checklist do Dia */}
      {dayTasks.length > 0 && (
        <div className="agenda-day-tasks-section">
          <div className="agenda-day-tasks-header">
            <div className="agenda-day-tasks-title">
              <CheckSquare size={16} />
              <span>Pendências do Dia</span>
              <span className="agenda-day-tasks-badge">
                {dayTasks.filter((t) => t.completed).length}/{dayTasks.length}
              </span>
            </div>
            {onNewTaskForDay && selectedDate && (
              <button
                type="button"
                className="agenda-day-tasks-add-btn"
                onClick={() => onNewTaskForDay(selectedDate)}
                title="Adicionar pendência neste dia"
              >
                <Plus size={15} />
                <span>Adicionar</span>
              </button>
            )}
          </div>

          <div className="agenda-day-tasks-list">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className={`agenda-day-task-item ${task.completed ? 'is-completed' : ''}`}
              >
                <button
                  type="button"
                  className="agenda-day-task-checkbox"
                  onClick={() => onToggleTask && onToggleTask(task)}
                >
                  {task.completed ? (
                    <CheckCircle2 size={18} className="check-icon checked" />
                  ) : (
                    <div className="custom-empty-checkbox small" />
                  )}
                </button>

                <div
                  className="agenda-day-task-text"
                  onClick={() => onToggleTask && onToggleTask(task)}
                >
                  <span className={`agenda-day-task-title ${task.completed ? 'strike' : ''}`}>
                    {task.title}
                  </span>
                  {task.agendaEventId && (
                    <span className="agenda-day-task-event-tag">
                      {task.eventTitle || 'Compromisso'}
                    </span>
                  )}
                </div>

                <div className="agenda-day-task-actions">
                  {onEditTask && (
                    <button
                      type="button"
                      className="agenda-day-task-action-btn edit"
                      onClick={() => onEditTask(task)}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {onDeleteTask && (
                    <button
                      type="button"
                      className="agenda-day-task-action-btn delete"
                      onClick={() => onDeleteTask(task)}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão sutil para adicionar pendência caso já existam eventos mas sem pendências ainda */}
      {sortedEvents.length > 0 && dayTasks.length === 0 && onNewTaskForDay && selectedDate && (
        <div className="agenda-day-add-task-row">
          <button
            type="button"
            className="agenda-day-add-task-btn subtle"
            onClick={() => onNewTaskForDay(selectedDate)}
          >
            <Plus size={15} />
            <span>Adicionar pendência para este dia</span>
          </button>
        </div>
      )}
    </div>
  );
};

