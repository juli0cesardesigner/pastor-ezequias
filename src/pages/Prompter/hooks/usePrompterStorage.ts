import { useState, useEffect } from 'react';

export interface PrompterDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface PrompterSettings {
  fontSize: number; // in pixels (e.g. 24 to 96)
  speed: number; // 1 to 100
  maxWidth: number; // in px (e.g. 480 to 1200)
  lineGuide: boolean; // show reading guide line
  textColor: 'white' | 'amber' | 'cyan';
  textAlign: 'left' | 'center';
  mirrorHorizontal: boolean;
}

const STORAGE_KEYS = {
  TEXT: 'teleprompter_current_text',
  SETTINGS: 'teleprompter_settings',
  DRAFTS: 'teleprompter_drafts',
};

const DEFAULT_SETTINGS: PrompterSettings = {
  fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 38 : 52,
  speed: 28,
  maxWidth: 820,
  lineGuide: true,
  textColor: 'white',
  textAlign: 'center',
  mirrorHorizontal: false,
};

export function usePrompterStorage() {
  const [text, setText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEXT);
      return saved ?? '';
    } catch {
      return '';
    }
  });

  const [settings, setSettings] = useState<PrompterSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignorar erro
    }
    return DEFAULT_SETTINGS;
  });

  const [drafts, setDrafts] = useState<PrompterDraft[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignorar erro
    }
    return [];
  });

  // Salvar texto atual sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEXT, text);
    } catch {
      // Silenciar erro de cota
    }
  }, [text]);

  // Salvar configurações
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Silenciar erro
    }
  }, [settings]);

  // Salvar rascunhos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch {
      // Silenciar erro
    }
  }, [drafts]);

  const updateSetting = <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveCurrentAsDraft = (title?: string) => {
    if (!text.trim()) return;
    const finalTitle = title?.trim() || text.trim().slice(0, 30) || 'Rascunho';
    const newDraft: PrompterDraft = {
      id: Date.now().toString(),
      title: finalTitle,
      content: text,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
    };
    setDrafts((prev) => [newDraft, ...prev.filter((d) => d.title !== finalTitle)].slice(0, 10));
  };

  const loadDraft = (draft: PrompterDraft) => {
    setText(draft.content);
  };

  const deleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const clearText = () => {
    setText('');
  };

  return {
    text,
    setText,
    settings,
    updateSetting,
    drafts,
    saveCurrentAsDraft,
    loadDraft,
    deleteDraft,
    clearText,
  };
}
