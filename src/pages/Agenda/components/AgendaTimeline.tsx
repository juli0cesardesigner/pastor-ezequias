import React, { useState } from 'react';
import {
  CalendarClock,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { AgendaEvent } from '../../../types/agenda';

interface AgendaTimelineProps {
  events: AgendaEvent[];
  selectedDate?: string;
  onEdit: (event: AgendaEvent) => void;
  onPostpone: (event: AgendaEvent) => void;
  onDelete: (event: AgendaEvent) => void;
  onToggleStatus?: (event: AgendaEvent) => void;
}

const ACCENT_COLORS = ['#4ade80', '#c084fc', '#38bdf8', '#fb7185'];
const IMPORTANT_DATE_COLOR = '#f59e0b';

export const AgendaTimeline: React.FC<AgendaTimelineProps> = ({
  events,
  onEdit,
  onPostpone,
  onDelete,
}) => {
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  if (events.length === 0) {
    return (
      <div className="agenda-simple-empty">
        <p>Sem eventos agendados para este dia.</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => {
    if (a.eventType === 'data_importante' && b.eventType !== 'data_importante') return -1;
    if (b.eventType === 'data_importante' && a.eventType !== 'data_importante') return 1;
    return (a.eventTime || '99:99').localeCompare(b.eventTime || '99:99');
  });

  const handleRowClick = (id: number) => {
    setActiveEventId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="agenda-swipe-list">
      {sorted.map((ev, index) => {
        const isActive = activeEventId === ev.id;
        const isImportant = ev.eventType === 'data_importante';
        const color = isImportant ? IMPORTANT_DATE_COLOR : ACCENT_COLORS[index % ACCENT_COLORS.length];

        return (
          <div
            key={ev.id}
            className={`agenda-swipe-row-container ${isImportant ? 'is-important-date' : ''}`}
          >
            {/* Camada inferior: 3 ícones fixos por baixo (só renderizados/visíveis quando ativo) */}
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

            {/* Camada superior: o card do evento com fundo sólido opaco */}
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
    </div>
  );
};
