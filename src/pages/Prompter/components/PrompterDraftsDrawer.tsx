import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import type { PrompterDraft } from '../hooks/usePrompterStorage';

interface PrompterDraftsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: PrompterDraft[];
  draftTitleInput: string;
  onDraftTitleChange: (value: string) => void;
  onSaveDraft: (e: React.FormEvent) => void;
  onLoadDraft: (draft: PrompterDraft) => void;
  onDeleteDraft: (id: string) => void;
  canSave: boolean;
}

export const PrompterDraftsDrawer: React.FC<PrompterDraftsDrawerProps> = ({
  isOpen,
  onClose,
  drafts,
  draftTitleInput,
  onDraftTitleChange,
  onSaveDraft,
  onLoadDraft,
  onDeleteDraft,
  canSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="drafts-drawer-card">
      <div className="drafts-card-header">
        <div className="drafts-title">
          <Bookmark size={16} className="text-amber" />
          <span>Rascunhos Salvos neste Navegador</span>
        </div>
        <button
          type="button"
          className="close-sm-btn"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <form onSubmit={onSaveDraft} className="draft-save-form">
        <input
          type="text"
          placeholder="Nome do rascunho local..."
          value={draftTitleInput}
          onChange={(e) => onDraftTitleChange(e.target.value)}
          className="draft-input"
        />
        <button type="submit" className="save-draft-btn" disabled={!canSave}>
          Salvar Rascunho
        </button>
      </form>

      <div className="drafts-list">
        {drafts.length === 0 ? (
          <p className="no-drafts-text">Nenhum rascunho local salvo.</p>
        ) : (
          drafts.map((draft) => (
            <div key={draft.id} className="draft-item">
              <div
                className="draft-info"
                onClick={() => onLoadDraft(draft)}
              >
                <strong className="draft-item-title">{draft.title}</strong>
                <span className="draft-item-date">{draft.updatedAt}</span>
                <p className="draft-item-preview">
                  {draft.content.slice(0, 75)}...
                </p>
              </div>
              <button
                type="button"
                className="delete-draft-btn"
                onClick={() => onDeleteDraft(draft.id)}
                title="Excluir rascunho"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

