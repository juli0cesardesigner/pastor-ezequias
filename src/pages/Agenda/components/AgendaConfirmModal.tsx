import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { AgendaEvent } from '../../../types/agenda';

interface AgendaConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  event: AgendaEvent | null;
}

export const AgendaConfirmModal: React.FC<AgendaConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  event,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !event) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="agenda-modal-overlay" onClick={onClose}>
      <div className="agenda-modal-container agenda-confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="agenda-modal-header">
          <div className="agenda-modal-title-wrap">
            <AlertTriangle size={22} style={{ color: '#ef4444' }} />
            <h3>Excluir Registro</h3>
          </div>
          <button type="button" className="agenda-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="agenda-confirm-body">
          <p>
            Tem certeza que deseja excluir o registro <strong>"{event.title}"</strong>?
          </p>
          <span className="agenda-confirm-warning">Esta ação removerá o evento da agenda permanentemente.</span>
        </div>

        <div className="agenda-modal-actions">
          <button
            type="button"
            className="btn-agenda-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-agenda-delete-confirm"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
