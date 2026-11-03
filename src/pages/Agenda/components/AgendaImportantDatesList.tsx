import React from 'react';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import type { AgendaEvent, AgendaPriority } from '../../../types/agenda';

interface AgendaImportantDatesListProps {
  events: AgendaEvent[];
  onEdit: (event: AgendaEvent) => void;
  onDelete: (event: AgendaEvent) => void;
  isLoading?: boolean;
}

export const AgendaImportantDatesList: React.FC<AgendaImportantDatesListProps> = ({
  events,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  // Apenas eventos do tipo 'data_importante' e não cancelados
  const importantDates = events
    .filter((ev) => ev.eventType === 'data_importante' && ev.status !== 'cancelado')
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const getPriorityInfo = (priority: AgendaPriority) => {
    switch (priority) {
      case 'baixa':
        return { label: 'Normal', color: '#10b981', className: 'color-green' };
      case 'urgente':
      case 'alta':
        return { label: 'Nunca Esquecer', color: '#ef4444', className: 'color-red' };
      case 'media':
      default:
        return { label: 'Importante', color: '#eab308', className: 'color-yellow' };
    }
  };

  const formatDateBR = (ymd: string) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  if (isLoading && importantDates.length === 0) {
    return (
      <div className="agenda-dates-empty">
        <p>Carregando datas importantes...</p>
      </div>
    );
  }

  if (importantDates.length === 0) {
    return (
      <div className="agenda-dates-empty">
        <div className="empty-icon-wrap">
          <Calendar size={36} className="text-agenda-muted" />
        </div>
        <p>Nenhuma data importante cadastrada.</p>
        <span className="empty-sub">
          Toque no botão <strong>+</strong> para adicionar aniversários, marcos ou eventos cruciais.
        </span>
      </div>
    );
  }

  return (
    <div className="agenda-important-dates-list">
      {importantDates.map((item) => {
        const pInfo = getPriorityInfo(item.priority);

        return (
          <div key={item.id} className="important-date-row-card">
            {/* Barra lateral colorida indicando a classificação */}
            <div
              className="important-date-indicator"
              style={{ backgroundColor: pInfo.color }}
            />

            <div className="important-date-content">
              <div className="important-date-main">
                <h4 className="important-date-title">{item.title}</h4>
                <div className="important-date-meta">
                  <span className="important-date-day">
                    {formatDateBR(item.eventDate)}
                  </span>
                  <span
                    className={`important-date-badge ${pInfo.className}`}
                    style={{
                      color: pInfo.color,
                      borderColor: `${pInfo.color}40`,
                      backgroundColor: `${pInfo.color}15`,
                    }}
                  >
                    {pInfo.label}
                  </span>
                </div>
              </div>

              {item.notes && item.notes.trim() && (
                <p className="important-date-notes">{item.notes}</p>
              )}
            </div>

            {/* Ações: Editar e Excluir */}
            <div className="important-date-actions">
              <button
                type="button"
                className="action-btn-mini edit"
                onClick={() => onEdit(item)}
                title="Editar data"
              >
                <Edit2 size={16} />
              </button>
              <button
                type="button"
                className="action-btn-mini delete"
                onClick={() => onDelete(item)}
                title="Excluir data"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

