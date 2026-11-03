import React from 'react';
import { Star, CalendarDays } from 'lucide-react';
import type { AgendaEvent } from '../../../types/agenda';

interface AgendaImportantDatesCardProps {
  events: AgendaEvent[];
  onSelectEvent: (event: AgendaEvent) => void;
}

export const AgendaImportantDatesCard: React.FC<AgendaImportantDatesCardProps> = ({
  events,
  onSelectEvent,
}) => {
  if (events.length === 0) return null;

  return (
    <div className="agenda-important-card">
      <div className="agenda-important-header">
        <div className="agenda-important-title">
          <Star size={16} className="star-icon" />
          <span>Datas Importantes / Marcos</span>
        </div>
        <span className="agenda-important-count">{events.length}</span>
      </div>

      <div className="agenda-important-list">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="agenda-important-item"
            onClick={() => onSelectEvent(ev)}
          >
            <CalendarDays size={15} />
            <span className="important-name">{ev.title}</span>
            {ev.notes && <span className="important-hint">{ev.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

