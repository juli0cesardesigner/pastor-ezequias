import { useState, useEffect } from 'react';

export type PrompterTextCase = 'original' | 'uppercase' | 'lowercase';

export interface PrompterPreset {
  id: string;
  name: string;
  fontSize: number;
  speed: number;
  isPreferred?: boolean;
}

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
  textColor: 'contrast-21' | 'white' | 'yellow-hiviz' | 'amber' | 'cyan';
  textAlign: 'left' | 'center';
  textCase: PrompterTextCase;
  mirrorHorizontal: boolean;
  forceLandscape: boolean; // girar 90 graus / modo paisagem em celulares
  rotationAngle?: number; // ângulo de rotação (0 ou 90)
}

const STORAGE_KEYS = {
  TEXT: 'teleprompter_current_text',
  SETTINGS: 'teleprompter_settings',
  DRAFTS: 'teleprompter_drafts',
  PRESETS: 'teleprompter_presets',
};

const DEFAULT_PRESETS: PrompterPreset[] = [
  { id: 'preset-padrao', name: 'Padrão Estúdio', fontSize: 52, speed: 28, isPreferred: true },
  { id: 'preset-reels', name: 'Reels Dinâmico', fontSize: 46, speed: 36, isPreferred: false },
  { id: 'preset-calmo', name: 'Leitura Pausada', fontSize: 58, speed: 22, isPreferred: false },
];

const DEFAULT_SETTINGS: PrompterSettings = {
  fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 38 : 52,
  speed: 28,
  maxWidth: 820,
  textColor: 'contrast-21',
  textAlign: 'center',
  textCase: 'original',
  mirrorHorizontal: false,
  forceLandscape: false,
  rotationAngle: 0,
};

function loadInitialPresets(): PrompterPreset[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignorar erro
  }
  return DEFAULT_PRESETS;
}

export function usePrompterStorage() {
  const [text, setText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEXT);
      return saved ?? '';
    } catch {
      return '';
    }
  });

  const [presets, setPresets] = useState<PrompterPreset[]>(loadInitialPresets);

  const [settings, setSettings] = useState<PrompterSettings>(() => {
    let base: PrompterSettings = { ...DEFAULT_SETTINGS };
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        base = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignorar erro
    }
    if (!base.textCase) {
      base.textCase = 'original';
    }
    const initialPresets = loadInitialPresets();
    const preferred = initialPresets.find((p) => p.isPreferred);
    if (preferred) {
      base = { ...base, fontSize: preferred.fontSize, speed: preferred.speed };
    }
    return base;
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

  // Salvar presets de fonte e tempo
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch {
      // Silenciar erro
    }
  }, [presets]);

  const updateSetting = <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const preferredPreset = presets.find((p) => p.isPreferred) || null;

  const applyPreset = (preset: PrompterPreset) => {
    setSettings((prev) => ({
      ...prev,
      fontSize: preset.fontSize,
      speed: preset.speed,
    }));
  };

  const savePreset = (name?: string, markPreferred?: boolean) => {
    const label = name?.trim() || `Fonte ${settings.fontSize} • Tempo ${settings.speed}`;
    setPresets((prev) => {
      const existingIdx = prev.findIndex(
        (p) =>
          p.name.toLowerCase() === label.toLowerCase() ||
          (!name?.trim() && p.fontSize === settings.fontSize && p.speed === settings.speed)
      );

      if (existingIdx >= 0) {
        return prev.map((p, idx) => {
          if (idx === existingIdx) {
            return {
              ...p,
              name: label,
              fontSize: settings.fontSize,
              speed: settings.speed,
              isPreferred: markPreferred !== undefined ? markPreferred : p.isPreferred,
            };
          }
          return markPreferred ? { ...p, isPreferred: false } : p;
        });
      }

      const newPreset: PrompterPreset = {
        id: `preset-${Date.now()}`,
        name: label,
        fontSize: settings.fontSize,
        speed: settings.speed,
        isPreferred: !!markPreferred,
      };
      const updatedPrev = markPreferred ? prev.map((p) => ({ ...p, isPreferred: false })) : prev;
      return [newPreset, ...updatedPrev];
    });
  };

  const saveCurrentAsPreferred = (name?: string) => {
    setPresets((prev) => {
      const exactMatch = prev.find(
        (p) => p.fontSize === settings.fontSize && p.speed === settings.speed
      );
      if (exactMatch) {
        return prev.map((p) => ({
          ...p,
          name: name?.trim() && p.id === exactMatch.id ? name.trim() : p.name,
          isPreferred: p.id === exactMatch.id,
        }));
      }

      const label = name?.trim() || `Preferencial (${settings.fontSize}px • ${settings.speed})`;
      const newPreset: PrompterPreset = {
        id: `preset-${Date.now()}`,
        name: label,
        fontSize: settings.fontSize,
        speed: settings.speed,
        isPreferred: true,
      };
      return [newPreset, ...prev.map((p) => ({ ...p, isPreferred: false }))];
    });
  };

  const setPreferredPreset = (id: string) => {
    const target = presets.find((p) => p.id === id);
    if (!target) return;
    setPresets((prev) => prev.map((p) => ({ ...p, isPreferred: p.id === id })));
    applyPreset(target);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
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
    presets,
    preferredPreset,
    applyPreset,
    savePreset,
    saveCurrentAsPreferred,
    setPreferredPreset,
    deletePreset,
    drafts,
    saveCurrentAsDraft,
    loadDraft,
    deleteDraft,
    clearText,
  };
}
