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
  FlipVertical,
  Wifi,
  Star,
  Trash2,
  Clock,
  Bookmark,
} from 'lucide-react';
import type { PrompterSettings, PrompterPreset, PrompterTextCase } from '../hooks/usePrompterStorage';

interface PrompterControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onBackToEdit: () => void;
  isInlineEditing?: boolean;
  onToggleInlineEdit?: () => void;
  settings: PrompterSettings;
  onUpdateSetting: <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => void;
  presets: PrompterPreset[];
  onApplyPreset: (preset: PrompterPreset) => void;
  onSavePreset: (name?: string, markPreferred?: boolean) => void;
  onSaveCurrentAsPreferred: (name?: string) => void;
  onSetPreferredPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onShowToast?: (msg: string) => void;
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

const TEXT_CASE_ORDER: PrompterTextCase[] = ['original', 'uppercase', 'lowercase'];

const TEXT_CASE_LABELS: Record<PrompterTextCase, { short: string; label: string }> = {
  original: { short: 'Aa', label: 'Como Copiado' },
  uppercase: { short: 'AA', label: 'Caixa Alta' },
  lowercase: { short: 'aa', label: 'Caixa Baixa' },
};

export const PrompterControls: React.FC<PrompterControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onBackToEdit,
  isInlineEditing,
  onToggleInlineEdit,
  settings,
  onUpdateSetting,
  presets,
  onApplyPreset,
  onSavePreset,
  onSaveCurrentAsPreferred,
  onSetPreferredPreset,
  onDeletePreset,
  onShowToast,
  isFullscreen,
  onToggleFullscreen,
  visible,
  estimatedSpeechTime,
  onOpenP2PModal,
  isP2PConnected,
  maxSafeFontSize,
  onShowWarning,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  const currentCase: PrompterTextCase = settings.textCase || 'original';

  const cycleTextCase = () => {
    const idx = TEXT_CASE_ORDER.indexOf(currentCase);
    const nextCase = TEXT_CASE_ORDER[(idx + 1) % TEXT_CASE_ORDER.length];
    onUpdateSetting('textCase', nextCase);
    onShowToast?.(`Texto: ${TEXT_CASE_LABELS[nextCase].label}`);
  };

  const preferredPreset = presets.find((p) => p.isPreferred);
  const isCurrentPreferred =
    !!preferredPreset &&
    preferredPreset.fontSize === settings.fontSize &&
    preferredPreset.speed === settings.speed;

  const handleSavePresetForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreset(presetNameInput, false);
    setPresetNameInput('');
    onShowToast?.(`Preset salvo (${settings.fontSize}px • Tempo ${settings.speed})`);
  };

  const handleSavePreferred = () => {
    onSaveCurrentAsPreferred(presetNameInput.trim() || undefined);
    setPresetNameInput('');
    onShowToast?.(`Preferencial salvo: Fonte ${settings.fontSize}px • Tempo ${settings.speed}`);
  };

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

  const isLandscapeAngle = currentAngle === 90 || currentAngle === 270;
  const isInverted180 = currentAngle === 180 || currentAngle === 270;

  const toggleLandscape = async () => {
    // Alterna entre Retrato (0°) e Paisagem (90°)
    const nextAngle = isLandscapeAngle ? 0 : 90;
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

  const toggleInvert180 = () => {
    const nextAngle = (currentAngle + 180) % 360;
    onUpdateSetting('rotationAngle', nextAngle);
    onUpdateSetting('forceLandscape', nextAngle === 90 || nextAngle === 270);
    const isNowInverted = nextAngle === 180 || nextAngle === 270;
    onShowToast?.(isNowInverted ? `Tela invertida 180° (${nextAngle}°)` : `Posição normal (${nextAngle}°)`);
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
                className={`prompter-hud-btn icon-btn ${isLandscapeAngle ? 'active' : ''}`}
                onClick={toggleLandscape}
                title={isLandscapeAngle ? 'Retornar para Retrato (0°)' : 'Girar para Paisagem (90°)'}
              >
                <RotateCw size={17} className={isLandscapeAngle ? 'rotate-icon-active' : ''} />
              </button>

              <button
                type="button"
                className={`prompter-hud-btn icon-btn ${isInverted180 ? 'active' : ''}`}
                onClick={toggleInvert180}
                title="Inverter Posição em 180° (Cabeça para Baixo)"
              >
                <FlipVertical size={17} className={isInverted180 ? 'text-amber' : ''} />
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
                className={`prompter-hud-btn icon-btn text-case-hud-btn ${currentCase !== 'original' ? 'active' : ''}`}
                onClick={cycleTextCase}
                title={`Caixa do Texto: ${TEXT_CASE_LABELS[currentCase].label} (clique para alternar)`}
              >
                <span className="hud-case-pill-text">{TEXT_CASE_LABELS[currentCase].short}</span>
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

          {/* Barra Inferior Centralizada com Presets Rápidos + 3 Controles */}
          <div className="prompter-hud-bottom-stack">
            {/* Presets Rápidos de Fonte + Tempo */}
            <div className="prompter-hud-presets-strip">
              {presets.map((preset) => {
                const isActive =
                  settings.fontSize === preset.fontSize && settings.speed === preset.speed;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`hud-preset-pill ${isActive ? 'active' : ''} ${preset.isPreferred ? 'is-preferred' : ''}`}
                    onClick={() => {
                      onApplyPreset(preset);
                      onShowToast?.(`Preset: ${preset.name} (${preset.fontSize}px • ${preset.speed})`);
                    }}
                    title={`${preset.name}: Fonte ${preset.fontSize}px • Tempo ${preset.speed}${preset.isPreferred ? ' (Preferencial)' : ''}`}
                  >
                    {preset.isPreferred && <Star size={11} className="preset-star-inline" />}
                    <span className="preset-pill-name">{preset.name}</span>
                    <span className="preset-pill-meta">{preset.fontSize}px·{preset.speed}</span>
                  </button>
                );
              })}

              {!isCurrentPreferred && (
                <button
                  type="button"
                  className="hud-preset-pill action-save-pref"
                  onClick={handleSavePreferred}
                  title="Salvar combinação atual de Fonte + Tempo como Preferencial"
                >
                  <Star size={11} />
                  <span>Salvar Preferencial</span>
                </button>
              )}

              <button
                type="button"
                className="hud-preset-pill action-save-preset"
                onClick={() => {
                  onSavePreset(undefined, false);
                  onShowToast?.(`Preset salvo (${settings.fontSize}px • ${settings.speed})`);
                }}
                title="Guardar combinação atual de Fonte + Tempo"
              >
                <Plus size={11} />
                <span>Guardar</span>
              </button>
            </div>

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
              className={`prompter-hud-circle-btn ${isLandscapeAngle ? 'active' : ''}`}
              onClick={toggleLandscape}
              title={isLandscapeAngle ? 'Retornar para Retrato (0°)' : 'Girar para Paisagem (90°)'}
            >
              <RotateCw size={18} className={isLandscapeAngle ? 'rotate-icon-active' : ''} />
            </button>

            <button
              type="button"
              className={`prompter-hud-circle-btn ${isInverted180 ? 'active' : ''}`}
              onClick={toggleInvert180}
              title="Inverter Posição em 180° (Cabeça para Baixo)"
            >
              <FlipVertical size={18} className={isInverted180 ? 'text-amber' : ''} />
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
              className={`prompter-hud-circle-btn text-case-hud-btn ${currentCase !== 'original' ? 'active' : ''}`}
              onClick={cycleTextCase}
              title={`Caixa do Texto: ${TEXT_CASE_LABELS[currentCase].label} (clique para alternar)`}
            >
              <span className="hud-case-pill-text">{TEXT_CASE_LABELS[currentCase].short}</span>
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
              {/* Caixa do Texto: Como Copiado / CAIXA ALTA / caixa baixa */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <Type size={16} /> Caixa do Texto
                  </span>
                  <span className="setting-value">
                    {TEXT_CASE_LABELS[currentCase].label}
                  </span>
                </div>
                <div className="case-presets-row">
                  <button
                    type="button"
                    className={`case-btn ${currentCase === 'original' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textCase', 'original')}
                  >
                    <span className="case-btn-badge">Aa</span>
                    <span>Como Copiado</span>
                  </button>
                  <button
                    type="button"
                    className={`case-btn ${currentCase === 'uppercase' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textCase', 'uppercase')}
                  >
                    <span className="case-btn-badge">AA</span>
                    <span>CAIXA ALTA</span>
                  </button>
                  <button
                    type="button"
                    className={`case-btn ${currentCase === 'lowercase' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting('textCase', 'lowercase')}
                  >
                    <span className="case-btn-badge">aa</span>
                    <span>caixa baixa</span>
                  </button>
                </div>
              </div>

              {/* Presets de Fonte & Tempo (Velocidade) */}
              <div className="setting-control-row presets-manager-box">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <Bookmark size={16} /> Presets de Fonte & Tempo
                  </span>
                  <span className="setting-value">
                    {settings.fontSize}px • Vel. {settings.speed}
                    {estimatedSpeechTime ? ` (${estimatedSpeechTime})` : ''}
                  </span>
                </div>

                <div className="presets-actions-bar">
                  <button
                    type="button"
                    className={`preferred-action-btn ${isCurrentPreferred ? 'is-active' : ''}`}
                    onClick={handleSavePreferred}
                    title="Salvar combinação atual de Fonte + Tempo como Preferencial (carregada por padrão)"
                  >
                    <Star size={14} className={isCurrentPreferred ? 'star-filled' : ''} />
                    <span>
                      {isCurrentPreferred ? 'Combinação Preferencial Ativa' : 'Salvar Atual como Preferencial'}
                    </span>
                  </button>
                </div>

                <form onSubmit={handleSavePresetForm} className="preset-save-inline-form">
                  <input
                    type="text"
                    className="preset-name-input"
                    placeholder={`Nome do preset (ex: Studio ${settings.fontSize}px)`}
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                  />
                  <button type="submit" className="preset-save-btn">
                    <Plus size={14} />
                    <span>Guardar</span>
                  </button>
                </form>

                {presets.length > 0 && (
                  <div className="presets-list-grid">
                    {presets.map((preset) => {
                      const isActive =
                        settings.fontSize === preset.fontSize && settings.speed === preset.speed;
                      return (
                        <div
                          key={preset.id}
                          className={`preset-item-card ${isActive ? 'active' : ''} ${
                            preset.isPreferred ? 'is-preferred' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="preset-item-apply-btn"
                            onClick={() => {
                              onApplyPreset(preset);
                              onShowToast?.(`Preset aplicado: ${preset.name}`);
                            }}
                          >
                            <span className="preset-item-name">
                              {preset.isPreferred && (
                                <Star size={12} className="star-filled inline-star" />
                              )}
                              {preset.name}
                            </span>
                            <span className="preset-item-specs">
                              Fonte <strong>{preset.fontSize}px</strong> • Tempo <strong>{preset.speed}</strong>
                            </span>
                          </button>

                          <div className="preset-item-controls">
                            <button
                              type="button"
                              className={`preset-star-btn ${preset.isPreferred ? 'active' : ''}`}
                              onClick={() => {
                                onSetPreferredPreset(preset.id);
                                onShowToast?.(`"${preset.name}" definido como Preferencial!`);
                              }}
                              title={
                                preset.isPreferred
                                  ? 'Preset Preferencial (carregado ao abrir)'
                                  : 'Definir como Preferencial'
                              }
                            >
                              <Star size={14} className={preset.isPreferred ? 'star-filled' : ''} />
                            </button>
                            <button
                              type="button"
                              className="preset-delete-btn"
                              onClick={() => onDeletePreset(preset.id)}
                              title="Excluir preset"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tempo / Velocidade de Leitura */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <Clock size={16} /> Tempo / Velocidade de Leitura
                  </span>
                  <span className="setting-value">
                    {settings.speed} {estimatedSpeechTime ? `• ${estimatedSpeechTime}` : ''}
                  </span>
                </div>
                <div className="setting-inline-controls">
                  <button type="button" className="stepper-btn-sm" onClick={decreaseSpeed}>
                    <Minus size={16} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={settings.speed}
                    onChange={(e) => onUpdateSetting('speed', Number(e.target.value))}
                    className="prompter-slider"
                  />
                  <button type="button" className="stepper-btn-sm" onClick={increaseSpeed}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Orientação da Tela: 0° Retrato, 90° Paisagem e Inversão 180° */}
              <div className="setting-control-row">
                <div className="setting-label-row">
                  <span className="setting-title">
                    <RotateCw size={16} /> Orientação da Tela
                  </span>
                  <span className="setting-value">
                    {currentAngle}° {isLandscapeAngle ? '(Paisagem)' : '(Retrato)'}
                    {isInverted180 ? ' • Invertido 180°' : ''}
                  </span>
                </div>
                <div className="orientation-presets-row">
                  <button
                    type="button"
                    className={`orientation-btn ${!isLandscapeAngle ? 'active' : ''}`}
                    onClick={() => {
                      const next = isInverted180 ? 180 : 0;
                      onUpdateSetting('rotationAngle', next);
                      onUpdateSetting('forceLandscape', false);
                    }}
                  >
                    <Smartphone size={16} />
                    <span>{isInverted180 ? '180° Retrato' : '0° Retrato'}</span>
                  </button>
                  <button
                    type="button"
                    className={`orientation-btn ${isLandscapeAngle ? 'active' : ''}`}
                    onClick={() => {
                      const next = isInverted180 ? 270 : 90;
                      onUpdateSetting('rotationAngle', next);
                      onUpdateSetting('forceLandscape', true);
                    }}
                  >
                    <RotateCw size={16} />
                    <span>{isInverted180 ? '270° Paisagem' : '90° Paisagem'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  className={`orientation-btn ${isInverted180 ? 'active' : ''}`}
                  onClick={toggleInvert180}
                  style={{ width: '100%' }}
                >
                  <FlipVertical size={16} />
                  <span>
                    {isInverted180
                      ? 'Posição Invertida 180° Ativa (Desfazer)'
                      : 'Inverter Posição 180° (Cabeça para Baixo)'}
                  </span>
                </button>
                <span className="setting-hint">
                  Use "Inverter Posição 180°" se o celular estiver de cabeça para baixo no encaixe do teleprompter.
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
