import React, { useState, useEffect } from 'react';
import { CloudUpload } from 'lucide-react';
import type { CloudScript } from '../../../services/prompterService';
import { calculateScriptStats, calculateSpeechTime } from '../utils/prompterSpeechTime';

interface PrompterSaveCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  speed: number;
  activeCloudScript: CloudScript | null;
  onConfirmSave: (data: { title: string; category?: string }) => Promise<void>;
}

export const PrompterSaveCloudModal: React.FC<PrompterSaveCloudModalProps> = ({
  isOpen,
  onClose,
  text,
  speed,
  activeCloudScript,
  onConfirmSave,
}) => {
  const [cloudTitle, setCloudTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (activeCloudScript) {
        setCloudTitle(activeCloudScript.title);
      } else {
        const firstLine = text.trim().split('\n')[0]?.slice(0, 45) || '';
        setCloudTitle(firstLine ? `${firstLine}...` : 'Novo Roteiro');
      }
    }
  }, [isOpen, activeCloudScript, text]);

  if (!isOpen) return null;

  const stats = calculateScriptStats(text);
  const speechTime = calculateSpeechTime(stats.words, speed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudTitle.trim()) return;

    setIsSaving(true);
    try {
      await onConfirmSave({
        title: cloudTitle.trim(),
        category: 'Geral',
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="prompter-modal-backdrop" onClick={onClose}>
      <div className="prompter-save-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <CloudUpload size={22} className="text-amber" />
            <h2 className="modal-title">
              {activeCloudScript ? 'Atualizar na Nuvem' : 'Salvar Novo Roteiro'}
            </h2>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="save-cloud-form">
          <div className="form-field">
            <label>Título do Roteiro</label>
            <input
              type="text"
              placeholder="Ex: Mensagem Domingo 19h..."
              value={cloudTitle}
              onChange={(e) => setCloudTitle(e.target.value)}
              required
              autoFocus
              className="modal-input"
            />
          </div>

          <div className="form-preview-box">
            <div className="preview-label">
              <span>Prévia ({stats.words} palavras • {speechTime})</span>
            </div>
            <p className="preview-content">{text.slice(0, 180)}...</p>
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="confirm-save-btn"
              disabled={isSaving || !cloudTitle.trim()}
            >
              {isSaving ? 'Salvando...' : activeCloudScript ? 'Atualizar' : 'Salvar no Banco'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
