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
  RotateCw,
  Smartphone,
  Contrast,
  Edit3,
  Check,
  FlipHorizontal,
  Wifi,
} from 'lucide-react';
import type { PrompterSettings } from '../hooks/usePrompterStorage';

interface PrompterControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onBackToEdit: () => void;
  isInlineEditing?: boolean;
  onToggleInlineEdit?: () => void;
  settings: PrompterSettings;
  onUpdateSetting: <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => void;
  isWakeLocked: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  visible: boolean;
  estimatedSpeechTime?: string;
  onOpenP2PModal?: () => void;
  isP2PConnected?: boolean;
  onOpenRemoteModal?: () => void;
  isRemoteConnected?: boolean;
  currentLine?: number;
  totalLines?: number;
  maxSafeFontSize?: number;
  onShowWarning?: (message: string) => void;
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
  onOpenP2PModal,
  isP2PConnected,
  maxSafeFontSize,
  onShowWarning,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const increaseSpeed = () => {
    onUpdateSetting('speed', Math.min(100, settings.speed + 1));
  };

  const decreaseSpeed = () => {
    onUpdateSetting('speed', Math.max(1, settings.speed - 1));
  };

  const increaseFontSize = () => {
    if (maxSafeFontSize && settings.fontSize >= maxSafeFontSize) {
      onShowWarning?.(
        `⚠️ Atenção: Aumentar a fonte acima de ${maxSafeFontSize}px pode causar quebra ou corte de palavras longas!`
      );
      return;
    }
    onUpdateSetting('fontSize', Math.min(110, settings.fontSize + 1));
  };

  const decreaseFontSize = () => {
    onUpdateSetting('fontSize', Math.max(20, settings.fontSize - 1));
  };

  const currentAngle = settings.rotationAngle !== undefined
    ? settings.rotationAngle
    : (settings.forceLandscape ? 90 : 0);

  const toggleLandscape = async () => {
    // Alterna exclusivamente entre 0° (Retrato) e 90° (Paisagem) - vai e volta
    const nextAngle = currentAngle === 90 ? 0 : 90;
    onUpdateSetting('rotationAngle', nextAngle);
    onUpdateSetting('forceLandscape', nextAngle === 90);

    if (nextAngle === 90) {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}
    }
  };

  return (
    <>
      <div
        className={`prompter-floating-hud ${visible || isInlineEditing ? 'is-visible' : 'is-hidden'} ${
          settings.forceLandscape ? 'is-forced-landscape' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* 1. MODO RETRATO: Barra Superior + Barra Inferior         */}
        {/* ======================================================== */}
        <div className="prompter-hud-portrait-wrap">
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
              ) : null}
            </div>

            <div className="prompter-hud-actions-right">
              {onToggleInlineEdit && (
                <button
                  type="button"
                  className={`prompter-hud-btn icon-btn ${isInlineEditing ? 'active-edit-btn' : ''}`}
                  onClick={onToggleInlineEdit}
                  title={isInlineEditing ? 'Concluir edição na tela (Esc)' : 'Editar texto diretamente na tela (E)'}
                >
                  {isInlineEditing ? <Check size={18} className="text-amber" /> : <Edit3 size={17} />}
                </button>
              )}

              <button
                type="button"
                className={`prompter-hud-btn icon-btn ${currentAngle === 90 ? 'active' : ''}`}
                onClick={toggleLandscape}
                title={currentAngle === 90 ? 'Retornar para Retrato (0°)' : 'Girar para Paisagem (90°)'}
              >
                <RotateCw size={17} className={currentAngle === 90 ? 'rotate-icon-active' : ''} />
              </button>

              <button
                type="button"
                className={`prompter-hud-btn icon-btn ${settings.mirrorHorizontal ? 'active' : ''}`}
                onClick={() => onUpdateSetting('mirrorHorizontal', !settings.mirrorHorizontal)}
                title={settings.mirrorHorizontal ? 'Desativar Espelho Óptico' : 'Espelhar Horizontalmente (Espelho Óptico)'}
              >
                <FlipHorizontal size={17} className={settings.mirrorHorizontal ? 'text-amber' : ''} />
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

        {/* ======================================================== */}
        {/* 2. MODO PAISAGEM (LANDSCAPE): DOCK ÚNICO NO RODAPÉ       */}
        {/* ======================================================== */}
        <div className="prompter-hud-landscape-dock">
          {/* Lado Esquerdo: Botões Redondos + Badge de Tempo */}
          <div className="hud-landscape-left">
            <button
              type="button"
              className="prompter-hud-circle-btn"
              onClick={onBackToEdit}
              title="Voltar à Lista de Roteiros (Esc)"
            >
              <Home size={18} />
            </button>

            {onToggleInlineEdit && (
              <button
                type="button"
                className={`prompter-hud-circle-btn ${isInlineEditing ? 'active-edit-btn' : ''}`}
                onClick={onToggleInlineEdit}
                title={isInlineEditing ? 'Concluir edição na tela (Esc)' : 'Editar texto diretamente na tela (E)'}
              >
                {isInlineEditing ? <Check size={18} className="text-amber" /> : <Edit3 size={18} />}
              </button>
            )}

            <button
              type="button"
              className={`prompter-hud-circle-btn ${currentAngle === 90 ? 'active' : ''}`}
              onClick={toggleLandscape}
              title={currentAngle === 90 ? 'Retornar para Retrato (0°)' : 'Girar para Paisagem (90°)'}
            >
              <RotateCw size={18} className={currentAngle === 90 ? 'rotate-icon-active' : ''} />
            </button>

            <button
              type="button"
              className={`prompter-hud-circle-btn ${settings.mirrorHorizontal ? 'active' : ''}`}
              onClick={() => onUpdateSetting('mirrorHorizontal', !settings.mirrorHorizontal)}
              title={settings.mirrorHorizontal ? 'Desativar Espelho Óptico' : 'Espelhar Horizontalmente (Espelho Óptico)'}
            >
              <FlipHorizontal size={18} className={settings.mirrorHorizontal ? 'text-amber' : ''} />
            </button>

            <button
              type="button"
              className={`prompter-hud-circle-btn ${showSettingsDrawer ? 'active' : ''}`}
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              title="Ajustes de visualização"
            >
              <Sliders size={18} />
            </button>

            <button
              type="button"
              className="prompter-hud-circle-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            {isInlineEditing ? (
              <span className="prompter-landscape-time-badge is-editing" title="Modo de edição direta ativo">
                ✏️ Editando
              </span>
            ) : null}
          </div>

          {/* Lado Direito: Stepper Velocidade + Stepper Fonte + Botão Play Amarelo */}
          <div className="hud-landscape-right">
            {/* Stepper Velocidade */}
            <div className="prompter-landscape-stepper" title="Velocidade de rolagem">
              <button
                type="button"
                className="landscape-stepper-btn"
                onClick={decreaseSpeed}
                title="Diminuir velocidade"
              >
                <Minus size={15} />
              </button>
              <span className="landscape-stepper-val">{settings.speed}</span>
              <button
                type="button"
                className="landscape-stepper-btn"
                onClick={increaseSpeed}
                title="Aumentar velocidade"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Stepper Fonte */}
            <div className="prompter-landscape-stepper" title="Tamanho da fonte">
              <button
                type="button"
                className="landscape-stepper-btn"
                onClick={decreaseFontSize}
                title="Diminuir tamanho da fonte"
              >
                <Minus size={15} />
              </button>
              <span className="landscape-stepper-val">{settings.fontSize}</span>
              <button
                type="button"
                className="landscape-stepper-btn"
                onClick={increaseFontSize}
                title="Aumentar tamanho da fonte"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Botão Play Amarelo */}
            <button
              type="button"
              className={`prompter-landscape-play-btn ${isPlaying ? 'is-playing' : 'is-paused'}`}
              onClick={onTogglePlay}
              title={isPlaying ? 'Pausar (Espaço)' : 'Iniciar Leitura (Espaço)'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="play-icon-offset-sm" />}
            </button>
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
              {/* Orientação da Tela: 0° Retrato ou 90° Paisagem */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <RotateCw size={16} /> Orientação da Tela
                  </span>
                  <span className="setting-value">
                    {currentAngle === 90 ? '90° (Paisagem)' : '0° (Retrato)'}
                  </span>
                </div>
                <div className="orientation-presets-row">
                  <button
                    type="button"
                    className={`orientation-btn ${currentAngle === 0 ? 'active' : ''}`}
                    onClick={() => {
                      onUpdateSetting('rotationAngle', 0);
                      onUpdateSetting('forceLandscape', false);
                    }}
                  >
                    <Smartphone size={16} />
                    <span>0° Retrato</span>
                  </button>
                  <button
                    type="button"
                    className={`orientation-btn ${currentAngle === 90 ? 'active' : ''}`}
                    onClick={() => {
                      onUpdateSetting('rotationAngle', 90);
                      onUpdateSetting('forceLandscape', true);
                    }}
                  >
                    <RotateCw size={16} />
                    <span>90° Paisagem</span>
                  </button>
                </div>
                <span className="setting-hint">
                  Alterna a exibição exclusivamente entre Retrato (0°) e Paisagem (90°).
                </span>
              </div>

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
                    max={maxSafeFontSize ? Math.max(maxSafeFontSize, 110) : 110}
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      if (maxSafeFontSize && newSize > maxSafeFontSize) {
                        onShowWarning?.(
                          `⚠️ Atenção: Tamanho acima de ${maxSafeFontSize}px causará hifenização ou quebra da maior frase!`
                        );
                        return;
                      }
                      onUpdateSetting('fontSize', newSize);
                    }}
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
                  min="320"
                  max="1400"
                  step="20"
                  value={settings.maxWidth}
                  onChange={(e) => onUpdateSetting('maxWidth', Number(e.target.value))}
                  className="prompter-slider"
                />
                <span className="setting-hint">
                  Deixe mais estreito para não desviar o olhar da câmera do celular.
                </span>
              </div>

              {/* Cor do Texto com Contraste Máximo 21:1 */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <Contrast size={16} /> Cor e Contraste (OLED Pro)
                  </span>
                  {settings.textColor === 'contrast-21' && (
                    <span className="contrast-badge-pill" title="Proporção matemática máxima de contraste WCAG AAA">
                      ⚡ 21:1 Máximo
                    </span>
                  )}
                </div>
                <div className="color-presets-grid">
                  <button
                    type="button"
                    className={`color-preset-btn highlight-max-contrast ${
                      settings.textColor === 'contrast-21' ? 'active' : ''
                    }`}
                    onClick={() => onUpdateSetting('textColor', 'contrast-21')}
                    title="Branco 100% sobre Preto Puro (21:1 Proporção Máxima WCAG AAA)"
                  >
                    <span className="color-dot color-contrast-21" />
                    <span className="color-btn-title">Branco 21:1</span>
                    <span className="color-btn-sub">Máx. Contraste</span>
                  </button>

                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'yellow-hiviz' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'yellow-hiviz')}
                    title="Amarelo Neon Hi-Viz (19.5:1 Alto Contraste)"
                  >
                    <span className="color-dot color-yellow-hiviz" />
                    <span className="color-btn-title">Amarelo Hi-Vis</span>
                    <span className="color-btn-sub">19.5:1 Neon</span>
                  </button>

                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'amber' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'amber')}
                  >
                    <span className="color-dot color-amber" />
                    <span className="color-btn-title">Âmbar</span>
                    <span className="color-btn-sub">Estúdio Pro</span>
                  </button>

                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'cyan' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'cyan')}
                  >
                    <span className="color-dot color-cyan" />
                    <span className="color-btn-title">Ciano</span>
                    <span className="color-btn-sub">Azul Suave</span>
                  </button>

                  <button
                    type="button"
                    className={`color-preset-btn ${settings.textColor === 'white' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textColor', 'white')}
                  >
                    <span className="color-dot color-white" />
                    <span className="color-btn-title">Branco Suave</span>
                    <span className="color-btn-sub">Padrão</span>
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

              {/* Conexão / Pareamento com Operador Remoto */}
              {onOpenP2PModal && (
                <div className="setting-action-row" style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #27272a' }}>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <span className="setting-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Wifi size={16} className={isP2PConnected ? 'text-emerald-400' : 'text-amber'} />
                      Operador Remoto (P2P)
                    </span>
                    <p className="setting-desc">Conecte um notebook ou tablet para operar à distância</p>
                  </div>
                  <button
                    type="button"
                    className={`prompter-btn-secondary full-width ${isP2PConnected ? 'is-connected' : ''}`}
                    onClick={() => {
                      onOpenP2PModal();
                      setShowSettingsDrawer(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '0.5rem',
                      border: isP2PConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #3f3f46',
                      background: isP2PConnected ? 'rgba(16, 185, 129, 0.12)' : '#18181b',
                      color: isP2PConnected ? '#34d399' : '#f4f4f5',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Wifi size={16} className={isP2PConnected ? 'text-emerald-400' : 'text-amber'} />
                    <span>{isP2PConnected ? 'Operador Ativo (Configurar)' : 'Parear Operador'}</span>
                  </button>
                </div>
              )}
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
