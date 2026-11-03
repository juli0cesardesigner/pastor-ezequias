import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Star, Bell, BellOff, LogOut, X } from 'lucide-react';

interface AgendaSpeedDialProps {
  onSelectCompromisso: () => void;
  onSelectDataImportante: () => void;
  pushSubscribed: boolean;
  onTogglePush: () => void;
  onLogout: () => void;
}

export const AgendaSpeedDial: React.FC<AgendaSpeedDialProps> = ({
  onSelectCompromisso,
  onSelectDataImportante,
  pushSubscribed,
  onTogglePush,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenCompromisso = () => {
    setIsOpen(false);
    onSelectCompromisso();
  };

  const handleOpenDataImportante = () => {
    setIsOpen(false);
    onSelectDataImportante();
  };

  const handleToggleNotification = () => {
    setIsOpen(false);
    onTogglePush();
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="agenda-speeddial-wrapper" ref={menuRef}>
      {/* Backdrop transparente */}
      {isOpen && (
        <div
          className="agenda-speeddial-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu com as opções no FAB: Ações Principais e Secundárias */}
      {isOpen && (
        <div className="agenda-speeddial-options">
          {/* Opção Secundária 1: Sair da Conta (Discreta) */}
          <button
            type="button"
            className="speeddial-option-btn option-secondary option-logout"
            onClick={handleLogout}
          >
            <span className="speeddial-label secondary">Sair da Conta</span>
            <div className="speeddial-icon-circle secondary red">
              <LogOut size={16} />
            </div>
          </button>

          {/* Opção Secundária 2: Ativar / Desativar Notificações (Discreta) */}
          <button
            type="button"
            className="speeddial-option-btn option-secondary option-notification"
            onClick={handleToggleNotification}
          >
            <span className="speeddial-label secondary">
              {pushSubscribed ? 'Notificações Ativas' : 'Notificações'}
            </span>
            <div className={`speeddial-icon-circle secondary ${pushSubscribed ? 'green' : 'gray'}`}>
              {pushSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
            </div>
          </button>

          {/* Divisor sutil entre ações do sistema e ações de criação */}
          <div className="speeddial-divider" />

          {/* Opção Principal 1: Data Importante (Destacada) */}
          <button
            type="button"
            className="speeddial-option-btn option-primary option-data-importante"
            onClick={handleOpenDataImportante}
          >
            <span className="speeddial-label primary gold">Data Importante</span>
            <div className="speeddial-icon-circle primary gold">
              <Star size={22} />
            </div>
          </button>

          {/* Opção Principal 2: Compromisso (Destacada) */}
          <button
            type="button"
            className="speeddial-option-btn option-primary option-compromisso"
            onClick={handleOpenCompromisso}
          >
            <span className="speeddial-label primary blue">Compromisso</span>
            <div className="speeddial-icon-circle primary blue">
              <Calendar size={22} />
            </div>
          </button>
        </div>
      )}

      {/* Botão FAB Principal */}
      <button
        type="button"
        className={`agenda-fab ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Menu"
        aria-label="Menu de Ações"
      >
        {isOpen ? <X size={26} /> : <Plus size={26} />}
      </button>
    </div>
  );
};
