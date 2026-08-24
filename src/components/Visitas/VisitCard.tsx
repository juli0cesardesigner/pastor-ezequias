import React from 'react';
import type { Visita } from '../../types/visitas';
import './VisitCard.css';

interface VisitCardProps {
  visita: Visita;
  isSelected: boolean;
  onSelect: (visita: Visita) => void;
  onToggleStatus: (visita: Visita) => void;
  onEdit: (visita: Visita) => void;
  onDelete: (id: number) => void;
}

function formatVisitDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return trimmed;
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visita,
  isSelected,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const isVisitado = visita.status === 'visitado';
  const cleanPhone = visita.phone ? visita.phone.replace(/\D/g, '') : '';
  const formattedDate = formatVisitDate(visita.visitDate);
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá ${visita.contactName}, a paz do Senhor! Sou da equipe do Pastor Ezequias.`
      )}`
    : '';

  return (
    <div
      className={`visit-card ${isVisitado ? 'card-visitado' : 'card-pendente'} ${
        isSelected ? 'card-selected' : ''
      }`}
      onClick={() => onSelect(visita)}
    >
      <div className="card-top-row">
        <div className="card-info-main">
          <div className="card-city-badge">📍 {visita.city}</div>
          <h4 className="card-contact-name">{visita.contactName}</h4>
        </div>

        {/* Quick status toggle badge button */}
        <button
          type="button"
          className={`status-toggle-badge ${isVisitado ? 'badge-green' : 'badge-orange'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(visita);
          }}
          title="Clique para alternar o status da visita"
        >
          <span className="status-dot"></span>
          {isVisitado ? 'Visitado' : 'A Visitar'}
        </button>
      </div>

      {visita.role && <div className="card-role">👔 {visita.role}</div>}
      {visita.address && <div className="card-meta">🏠 {visita.address}</div>}
      {formattedDate && <div className="card-meta card-date">📅 {formattedDate}</div>}
      {visita.notes && <div className="card-notes">"{visita.notes}"</div>}


      <div className="card-actions-row">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn btn-whatsapp"
            onClick={(e) => e.stopPropagation()}
            title="Conversar no WhatsApp"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            WhatsApp
          </a>
        ) : (
          <span className="no-phone-tag">Sem tel</span>
        )}

        <div className="secondary-actions">
          <button
            type="button"
            className="action-btn btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(visita);
            }}
            title="Editar visita"
          >
            ✏️
          </button>
          <button
            type="button"
            className="action-btn btn-icon btn-del"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Deseja excluir a visita de ${visita.contactName}?`)) {
                onDelete(visita.id);
              }
            }}
            title="Excluir visita"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};
