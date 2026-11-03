import React from 'react';
import { Bell, BellOff, LogOut, Plus } from 'lucide-react';
import type { AgendaSessionUser } from '../../../types/agenda';

interface AgendaHeaderProps {
  user: AgendaSessionUser;
  pushSubscribed: boolean;
  onRequestPush: () => void;
  onLogout: () => void;
  onNewEvent: () => void;
}

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  user,
  pushSubscribed,
  onRequestPush,
  onLogout,
  onNewEvent,
}) => {
  return (
    <header className="agenda-pwa-header">
      <div className="agenda-header-user">
        <div className="agenda-avatar">
          <img src="/foto.webp" alt={user.name} />
          <span className="agenda-online-badge" />
        </div>
        <div className="agenda-user-info">
          <span className="agenda-greeting">Olá, {user.name.split(' ')[0]}</span>
          <h1 className="agenda-title">Agenda Pessoal</h1>
        </div>
      </div>

      <div className="agenda-header-actions">
        <button
          className={`agenda-header-btn ${pushSubscribed ? 'active' : ''}`}
          onClick={onRequestPush}
          title={pushSubscribed ? 'Notificações Push Ativas' : 'Ativar Notificações no Celular'}
          aria-label="Notificações"
        >
          {pushSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
        </button>

        <button
          className="agenda-header-btn agenda-btn-primary"
          onClick={onNewEvent}
          title="Novo Compromisso"
        >
          <Plus size={18} />
          <span className="agenda-btn-text">Novo</span>
        </button>

        <button
          className="agenda-header-btn logout"
          onClick={onLogout}
          title="Sair da Agenda"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
