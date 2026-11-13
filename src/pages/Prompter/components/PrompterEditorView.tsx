import React, { useState } from 'react';
import {
  ArrowLeft,
  Bluetooth,
  Cloud,
  Wifi,
  CloudUpload,
  Bookmark,
  Trash2,
  Check,
  Play,
  FileText,
  Clock,
  Laptop,
  Star,
  Plus,
  Minus,
} from 'lucide-react';
import type { PrompterSettings, PrompterPreset, PrompterTextCase } from '../hooks/usePrompterStorage';
import type { CloudScript } from '../../../services/prompterService';
import { calculateScriptStats, calculateSpeechTime } from '../utils/prompterSpeechTime';

interface PrompterEditorViewProps {
  text: string;
  onTextChange: (newText: string) => void;
  settings: PrompterSettings;
  onUpdateSetting: <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => void;
  presets: PrompterPreset[];
  onApplyPreset: (preset: PrompterPreset) => void;
  onSavePreset: (name?: string, markPreferred?: boolean) => void;
  onSaveCurrentAsPreferred: (name?: string) => void;
  onSetPreferredPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onShowToast?: (msg: string) => void;
  activeCloudScript: CloudScript | null;
  cloudScriptsCount: number;
  draftsCount: number;
  // Navegação
  onBackToDashboard: () => void;
  onStartReading: () => void;
  // Ações de Nuvem & Hardware
  onOpenCloudModal: () => void;
  onOpenSaveCloudModal: () => void;
  onOpenRemoteModal: () => void;
  onOpenP2PModal: () => void;
  onToggleDraftsList: () => void;
  onClearText: () => void;
  onOpenOperatorMode: () => void;
  // Estados de Hardware
  isRemoteConnected: boolean;
  isP2PConnected: boolean;
  copiedNotification: string | null;
  editorTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const CASE_OPTIONS: { value: PrompterTextCase; badge: string; label: string }[] = [
  { value: 'original', badge: 'Aa', label: 'Como Copiado' },
  { value: 'uppercase', badge: 'AA', label: 'Caixa Alta' },
  { value: 'lowercase', badge: 'aa', label: 'Caixa Baixa' },
];

export const PrompterEditorView: React.FC<PrompterEditorViewProps> = ({
  text,
  onTextChange,
  settings,
  onUpdateSetting,
  presets,
  onApplyPreset,
  onSavePreset,
  onSaveCurrentAsPreferred,
  onSetPreferredPreset,
  onDeletePreset,
  onShowToast,
  activeCloudScript,
  cloudScriptsCount,
  draftsCount,
  onBackToDashboard,
  onStartReading,
  onOpenCloudModal,
  onOpenSaveCloudModal,
  onOpenRemoteModal,
  onOpenP2PModal,
  onToggleDraftsList,
  onClearText,
  onOpenOperatorMode,
  isRemoteConnected,
  isP2PConnected,
  copiedNotification,
  editorTextareaRef,
}) => {
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const stats = calculateScriptStats(text);
  const speechTime = calculateSpeechTime(stats.words, settings.speed);

  const currentCase: PrompterTextCase = settings.textCase || 'original';
  const textTransformStyle: React.CSSProperties['textTransform'] =
    currentCase === 'uppercase'
      ? 'uppercase'
      : currentCase === 'lowercase'
      ? 'lowercase'
      : 'none';

  const preferredPreset = presets.find((p) => p.isPreferred);
  const isCurrentPreferred =
    !!preferredPreset &&
    preferredPreset.fontSize === settings.fontSize &&
    preferredPreset.speed === settings.speed;

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreset(newPresetName, false);
    onShowToast?.(`Preset guardado (${settings.fontSize}px • Tempo ${settings.speed})`);
    setNewPresetName('');
    setShowPresetForm(false);
  };

  return (
    <div className="prompter-editor-container">
      {/* Topo do Editor */}
      <header className="prompter-editor-header">
        <div className="prompter-header-brand">
          <div className="prompter-badge-tag">
            <button
              type="button"
              className="back-hub-pill-btn"
              onClick={onBackToDashboard}
              title="Voltar ao Painel Principal"
            >
              <ArrowLeft size={13} />
              <span>Início / Hub</span>
            </button>

            <span className="dot-divider">•</span>

            <button
              type="button"
              className="cloud-status-pill"
              onClick={onOpenCloudModal}
              title="Abrir Roteiros na Nuvem"
            >
              <Cloud size={13} className="text-amber" />
              <span>Nuvem ({cloudScriptsCount})</span>
            </button>

            <span className="dot-divider">•</span>

            <button
              type="button"
              className={`p2p-header-pill ${isRemoteConnected ? 'is-connected' : ''}`}
              onClick={onOpenRemoteModal}
              title="Controle Remoto Bluetooth Feelworld"
            >
              <Bluetooth size={13} className={isRemoteConnected ? 'text-cyan-400' : 'text-zinc-400'} />
              <span>{isRemoteConnected ? 'Controle Ativo' : 'Controle BLE'}</span>
            </button>
          </div>

          <h1 className="prompter-title">
            {activeCloudScript ? activeCloudScript.title : 'Roteiro de Leitura'}
          </h1>
        </div>

        <div className="prompter-header-stats">
          <button
            type="button"
            className="operator-mode-toggle-btn"
            onClick={onOpenOperatorMode}
            title="Abrir Deck de Operador"
          >
            <Laptop size={14} />
            <span>Modo Operador</span>
          </button>

          <div className="stat-pill" title="Contagem de palavras">
            <FileText size={15} />
            <span><strong>{stats.words}</strong> pal.</span>
          </div>

          <div className="stat-pill highlight" title="Tempo estimado de fala">
            <Clock size={15} />
            <span><strong>{speechTime}</strong></span>
          </div>
        </div>
      </header>

      {/* Área Central / Textarea com Quick Actions */}
      <main className="prompter-editor-main">
        <div className="editor-textarea-wrapper">
          <textarea
            ref={editorTextareaRef}
            className="prompter-textarea"
            style={{ textTransform: textTransformStyle }}
            placeholder="Cole ou digite aqui seu texto para o teleprompter...&#10;&#10;Qualquer membro da equipe pode salvar e carregar roteiros em tempo real pela Nuvem!"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
          />

          <div className="textarea-quick-actions">
            <div className="left-actions">
              <button
                type="button"
                className="action-pill-btn cloud-btn"
                onClick={onOpenCloudModal}
              >
                <Cloud size={14} />
                <span>Roteiros na Nuvem ({cloudScriptsCount})</span>
              </button>

              <button
                type="button"
                className={`action-pill-btn p2p-action-btn ${isP2PConnected ? 'is-connected' : ''}`}
                onClick={onOpenP2PModal}
              >
                <Wifi size={14} className={isP2PConnected ? 'text-emerald-400' : ''} />
                <span>{isP2PConnected ? 'Operador Conectado' : 'Parear Operador'}</span>
              </button>

              {text.trim().length > 0 && (
                <button
                  type="button"
                  className="action-pill-btn highlight"
                  onClick={onOpenSaveCloudModal}
                >
                  <CloudUpload size={14} />
                  <span>{activeCloudScript ? 'Atualizar Nuvem' : 'Salvar na Nuvem'}</span>
                </button>
              )}
            </div>

            <div className="right-actions">
              <div className="editor-case-selector" role="group" aria-label="Caixa do texto">
                {CASE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`editor-case-btn ${currentCase === opt.value ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textCase', opt.value)}
                    title={`Exibir texto: ${opt.label}`}
                  >
                    <span className="editor-case-badge">{opt.badge}</span>
                    <span className="editor-case-label">{opt.label}</span>
                  </button>
                ))}
              </div>

              {draftsCount > 0 && (
                <button
                  type="button"
                  className="action-pill-btn"
                  onClick={onToggleDraftsList}
                >
                  <Bookmark size={14} />
                  <span>Rascunhos ({draftsCount})</span>
                </button>
              )}

              {text.trim().length > 0 && (
                <button
                  type="button"
                  className="action-pill-btn danger"
                  onClick={onClearText}
                >
                  <Trash2 size={14} />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {copiedNotification && (
          <div className="prompter-toast-alert">
            <Check size={16} />
            <span>{copiedNotification}</span>
          </div>
        )}
      </main>

      {/* Rodapé com Controles Rápidos, Presets de Fonte + Tempo e Botão Iniciar */}
      <footer className="prompter-editor-footer">
        <div className="editor-presets-footer-col">
          <div className="prompter-settings-preview interactive-steppers">
            <div className="editor-inline-stepper">
              <span className="stepper-mini-label">Fonte:</span>
              <button
                type="button"
                className="mini-step-btn"
                onClick={() => onUpdateSetting('fontSize', Math.max(20, settings.fontSize - 1))}
                title="Diminuir fonte"
              >
                <Minus size={12} />
              </button>
              <strong>{settings.fontSize}px</strong>
              <button
                type="button"
                className="mini-step-btn"
                onClick={() => onUpdateSetting('fontSize', Math.min(110, settings.fontSize + 1))}
                title="Aumentar fonte"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="editor-inline-stepper">
              <span className="stepper-mini-label">Tempo:</span>
              <button
                type="button"
                className="mini-step-btn"
                onClick={() => onUpdateSetting('speed', Math.max(1, settings.speed - 1))}
                title="Diminuir velocidade/tempo"
              >
                <Minus size={12} />
              </button>
              <strong>{settings.speed}</strong>
              <button
                type="button"
                className="mini-step-btn"
                onClick={() => onUpdateSetting('speed', Math.min(100, settings.speed + 1))}
                title="Aumentar velocidade/tempo"
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              type="button"
              className={`editor-pref-save-btn ${isCurrentPreferred ? 'is-active' : ''}`}
              onClick={() => {
                onSaveCurrentAsPreferred();
                onShowToast?.(`Preferencial salvo: Fonte ${settings.fontSize}px • Tempo ${settings.speed}`);
              }}
              title="Salvar combinação atual de Fonte + Tempo como Preferencial"
            >
              <Star size={12} className={isCurrentPreferred ? 'star-filled' : ''} />
              <span>{isCurrentPreferred ? 'Preferencial Ativo' : 'Salvar Preferencial'}</span>
            </button>

            <button
              type="button"
              className="editor-add-preset-btn"
              onClick={() => setShowPresetForm((prev) => !prev)}
              title="Guardar combinação atual como preset"
            >
              <Plus size={12} />
              <span>Guardar Preset</span>
            </button>
          </div>

          {showPresetForm && (
            <form onSubmit={handleSavePresetSubmit} className="editor-preset-inline-form">
              <input
                type="text"
                className="editor-preset-input"
                placeholder={`Nome do preset (ex: Estúdio ${settings.fontSize}px)`}
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="editor-preset-submit-btn">
                Salvar
              </button>
              <button
                type="button"
                className="editor-preset-cancel-btn"
                onClick={() => setShowPresetForm(false)}
              >
                Cancelar
              </button>
            </form>
          )}

          {presets.length > 0 && (
            <div className="editor-presets-bar">
              {presets.map((preset) => {
                const isActive =
                  settings.fontSize === preset.fontSize && settings.speed === preset.speed;
                return (
                  <div
                    key={preset.id}
                    className={`editor-preset-chip ${isActive ? 'active' : ''} ${
                      preset.isPreferred ? 'is-preferred' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="editor-preset-apply"
                      onClick={() => {
                        onApplyPreset(preset);
                        onShowToast?.(`Preset aplicado: ${preset.name}`);
                      }}
                      title={`Aplicar ${preset.name}: Fonte ${preset.fontSize}px • Tempo ${preset.speed}`}
                    >
                      {preset.isPreferred && <Star size={11} className="star-filled" />}
                      <span>{preset.name}</span>
                      <span className="editor-preset-meta">
                        {preset.fontSize}px · {preset.speed}
                      </span>
                    </button>
                    {!preset.isPreferred && (
                      <button
                        type="button"
                        className="editor-preset-star-action"
                        onClick={() => {
                          onSetPreferredPreset(preset.id);
                          onShowToast?.(`"${preset.name}" definido como Preferencial`);
                        }}
                        title="Definir este preset como Preferencial"
                      >
                        <Star size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="editor-preset-del-action"
                      onClick={() => onDeletePreset(preset.id)}
                      title="Excluir preset"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="prompter-primary-actions">
          <button
            type="button"
            className="prompter-start-btn"
            disabled={!text.trim()}
            onClick={onStartReading}
          >
            <Play size={22} className="play-icon-offset" />
            <span>Iniciar Teleprompter</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
