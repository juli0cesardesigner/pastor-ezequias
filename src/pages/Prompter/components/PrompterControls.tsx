import React, { useState } from 'react';
import {
  Play,
  Pause,
  Home,
  Sliders,
  Maximize,
  Minimize,
  Plus,
  Minus,
  X,
  Type,
  Edit3,
  Check,
} from 'lucide-react';
import type { PrompterSettings } from '../hooks/usePrompterStorage';

interface PrompterControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onBackToEdit: () => void;
  isInlineEditing: boolean;
  onToggleInlineEdit: () => void;
  settings: PrompterSettings;
  onUpdateSetting: <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => void;
  isWakeLocked: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  visible: boolean;
  estimatedSpeechTime?: string;
}

export const PrompterControls: React.FC<PrompterControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onBackToEdit,
  isInlineEditing,
  onToggleInlineEdit,
  settings,
  onUpdateSetting,
  isFullscreen,
  onToggleFullscreen,
  visible,
  estimatedSpeechTime,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const increaseSpeed = () => {
    onUpdateSetting('speed', Math.min(100, settings.speed + 2));
  };

  const decreaseSpeed = () => {
    onUpdateSetting('speed', Math.max(1, settings.speed - 2));
  };

  const increaseFontSize = () => {
    onUpdateSetting('fontSize', Math.min(110, settings.fontSize + 4));
  };

  const decreaseFontSize = () => {
    onUpdateSetting('fontSize', Math.max(20, settings.fontSize - 4));
  };

  return (
    <>
      <div
        className={`prompter-floating-hud ${visible || isInlineEditing ? 'is-visible' : 'is-hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior Compacta */}
        <div className="prompter-hud-top">
          <button
            type="button"
            className="prompter-hud-btn icon-btn"
            onClick={onBackToEdit}
            title="Voltar à Lista de Roteiros (Esc)"
          >
            <Home size={18} />
          </button>

          <div className="prompter-hud-center-info">
            {isInlineEditing ? (
              <span className="prompter-badge-time is-editing" title="Modo de edição direta ativo">
                ✏️ Editando na Tela
              </span>
            ) : estimatedSpeechTime ? (
              <span className="prompter-badge-time" title="Tempo estimado de fala">
                {estimatedSpeechTime}
              </span>
            ) : null}
          </div>

          <div className="prompter-hud-actions-right">
            <button
              type="button"
              className={`prompter-hud-btn icon-btn ${isInlineEditing ? 'active-edit-btn' : ''}`}
              onClick={onToggleInlineEdit}
              title={isInlineEditing ? 'Concluir edição na tela' : 'Editar texto diretamente na tela (E)'}
            >
              {isInlineEditing ? <Check size={18} className="text-amber" /> : <Edit3 size={17} />}
            </button>

            <button
              type="button"
              className={`prompter-hud-btn icon-btn ${showSettingsDrawer ? 'active' : ''}`}
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              title="Ajustes de visualização"
            >
              <Sliders size={18} />
            </button>

            <button
              type="button"
              className="prompter-hud-btn icon-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Barra Inferior Centralizada com 3 Controles */}
        <div className="prompter-hud-bottom">
          {/* 1. Controle de Velocidade */}
          <div className="prompter-hud-group speed-group">
            <span className="group-label">Velocidade</span>
            <div className="button-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={decreaseSpeed}
                title="Diminuir velocidade"
              >
                <Minus size={16} />
              </button>
              <span className="stepper-val">{settings.speed}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={increaseSpeed}
                title="Aumentar velocidade"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* 2. Botão Central de Play/Pause */}
          <div className="prompter-hud-center-play">
            <button
              type="button"
              className={`prompter-main-play-btn ${isPlaying ? 'is-playing' : 'is-paused'}`}
              onClick={onTogglePlay}
              title={isPlaying ? 'Pausar (Espaço)' : 'Iniciar Leitura (Espaço)'}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="play-icon-offset" />}
            </button>
          </div>

          {/* 3. Controle de Tamanho da Fonte */}
          <div className="prompter-hud-group font-group">
            <span className="group-label">Fonte</span>
            <div className="button-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={decreaseFontSize}
                title="Diminuir tamanho da fonte"
              >
                <Minus size={16} />
              </button>
              <span className="stepper-val">{settings.fontSize}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={increaseFontSize}
                title="Aumentar tamanho da fonte"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer / Modal de Configurações Avançadas */}
      {showSettingsDrawer && (
        <div
          className="prompter-settings-modal-overlay"
          onClick={() => setShowSettingsDrawer(false)}
        >
          <div
            className="prompter-settings-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="drawer-title">
                <Sliders size={20} className="text-amber" />
                <h3>Ajustes de Leitura</h3>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowSettingsDrawer(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content">
              {/* Tamanho da Fonte */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <Type size={16} /> Tamanho da Fonte
                  </span>
                  <span className="setting-value">{settings.fontSize}px</span>
                </div>
                <div className="setting-inline-controls">
                  <button type="button" className="stepper-btn-sm" onClick={decreaseFontSize}>
                    <Minus size={16} />
                  </button>
                  <input
                    type="range"
                    min="20"
                    max="110"
                    step="2"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSetting('fontSize', Number(e.target.value))}
                    className="prompter-slider"
                  />
                  <button type="button" className="stepper-btn-sm" onClick={increaseFontSize}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Largura da Margem / Coluna */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">Largura do Texto (Foco no Centro)</span>
                  <span className="setting-value">{settings.maxWidth}px</span>
                </div>
                <input
                  type="range"
                  min="420"
                  max="1300"
                  step="20"
                  value={settings.maxWidth}
                  onChange={(e) => onUpdateSetting('maxWidth', Number(e.target.value))}
                  className="prompter-slider"
                />
                <span className="setting-hint">
                  Deixe mais estreito para não desviar o olhar da câmera do celular.
                </span>
              </div>

              {/* Cor do Texto */}
              <div className="setting-control-row">
                <span className="setting-title">Cor do Texto (Alto Contraste OLED)</span>
                <div className="color-presets-row">
                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'white' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'white')}
                  >
                    <span className="color-dot color-white" />
                    <span>Branco Puro</span>
                  </button>
                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'amber' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'amber')}
                  >
                    <span className="color-dot color-amber" />
                    <span>Âmbar / Estúdio</span>
                  </button>
                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'cyan' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'cyan')}
                  >
                    <span className="color-dot color-cyan" />
                    <span>Azul Suave</span>
                  </button>
                </div>
              </div>

              {/* Alinhamento */}
              <div className="setting-control-row">
                <span className="setting-title">Alinhamento do Texto</span>
                <div className="align-presets-row">
                  <button
                    type="button"
                    className={`align-btn ${settings.textAlign === 'center' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textAlign', 'center')}
                  >
                    Centralizado
                  </button>
                  <button
                    type="button"
                    className={`align-btn ${settings.textAlign === 'left' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textAlign', 'left')}
                  >
                    À Esquerda
                  </button>
                </div>
              </div>

              {/* Guia de leitura central */}
              <div className="setting-toggle-row">
                <div>
                  <span className="setting-title">Marcador Visual da Linha</span>
                  <p className="setting-desc">Destaque sutil na área central de leitura</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.lineGuide}
                    onChange={(e) => onUpdateSetting('lineGuide', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Espelhamento Horizontal (vidro óptico) */}
              <div className="setting-toggle-row">
                <div>
                  <span className="setting-title">Espelhar Horizontalmente</span>
                  <p className="setting-desc">Para uso com vidro reflexivo / espelho óptico</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.mirrorHorizontal}
                    onChange={(e) => onUpdateSetting('mirrorHorizontal', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="prompter-btn-primary full-width"
                onClick={() => setShowSettingsDrawer(false)}
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
