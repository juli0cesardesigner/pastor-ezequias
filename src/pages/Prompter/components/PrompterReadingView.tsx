import React, { useMemo, useState, useEffect } from 'react';
import { PrompterControls } from './PrompterControls';
import { PrompterCountdown } from './PrompterCountdown';
import type { PrompterSettings, PrompterPreset } from '../hooks/usePrompterStorage';
import { calculateMaxSafeFontSize } from '../utils/prompterFontSize';

interface PrompterReadingViewProps {
  text: string;
  scriptLines: string[];
  settings: PrompterSettings;
  updateSetting: <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => void;
  presets: PrompterPreset[];
  onApplyPreset: (preset: PrompterPreset) => void;
  onSavePreset: (name?: string, markPreferred?: boolean) => void;
  onSaveCurrentAsPreferred: (name?: string) => void;
  onSetPreferredPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onShowToast?: (msg: string) => void;
  // Estados de Leitura
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  showCountdown: boolean;
  onCountdownComplete: () => void;
  onCountdownCancel: () => void;
  showControls: boolean;
  onTriggerControls: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  // Linha e Scroll
  activeLineIndex: number;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onScrollToLine: (index: number) => void;
  onManualScroll: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onScreenClick?: () => void;
  // Edição Inline
  isInlineEditing: boolean;
  onToggleInlineEdit: (lineIdx?: number) => void;
  inlineTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInlineTextChange: (newText: string) => void;
  // Conexões
  isWakeLocked: boolean;
  isRemoteConnected: boolean;
  onOpenRemoteModal: () => void;
  isP2PConnected: boolean;
  onOpenP2PModal: () => void;
  // Navegação
  onBackToEdit: () => void;
  // Notificações
  flashAlertMessage: string | null;
  copiedNotification: string | null;
  estimatedSpeechTime?: string;
}

export const PrompterReadingView: React.FC<PrompterReadingViewProps> = ({
  text,
  scriptLines,
  settings,
  updateSetting,
  presets,
  onApplyPreset,
  onSavePreset,
  onSaveCurrentAsPreferred,
  onSetPreferredPreset,
  onDeletePreset,
  onShowToast,
  isPlaying,
  onTogglePlay,
  onRestart,
  showCountdown,
  onCountdownComplete,
  onCountdownCancel,
  showControls,
  onTriggerControls,
  isFullscreen,
  onToggleFullscreen,
  activeLineIndex,
  scrollerRef,
  onManualScroll,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onScreenClick,
  isInlineEditing,
  onToggleInlineEdit,
  inlineTextareaRef,
  onInlineTextChange,
  isWakeLocked,
  isRemoteConnected,
  onOpenRemoteModal,
  isP2PConnected,
  onOpenP2PModal,
  onBackToEdit,
  flashAlertMessage,
  copiedNotification,
  estimatedSpeechTime,
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Calcula a largura disponível para a coluna de texto
  const containerWidth = useMemo(() => {
    if (typeof window === 'undefined') return settings.maxWidth;
    const windowWidth = settings.forceLandscape ? window.innerHeight : window.innerWidth;
    return Math.min(windowWidth, settings.maxWidth);
  }, [settings.maxWidth, settings.forceLandscape]);

  // Calcula o tamanho máximo seguro de fonte para que nenhuma palavra quebre ou hifenize
  const transformedTextForMeasure = useMemo(() => {
    if (settings.textCase === 'uppercase') return text.toUpperCase();
    if (settings.textCase === 'lowercase') return text.toLowerCase();
    return text;
  }, [text, settings.textCase]);

  const maxSafeFontSize = useMemo(() => {
    return calculateMaxSafeFontSize(transformedTextForMeasure, containerWidth, 48);
  }, [transformedTextForMeasure, containerWidth]);

  const textTransformValue: React.CSSProperties['textTransform'] =
    settings.textCase === 'uppercase'
      ? 'uppercase'
      : settings.textCase === 'lowercase'
      ? 'lowercase'
      : 'none';

  const handleShowWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningMessage(null);
    }, 3800);
  };

  // Ajuste automático de altura da textarea de edição para ocupar o espaço exato do texto
  useEffect(() => {
    if (isInlineEditing && inlineTextareaRef.current) {
      const el = inlineTextareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, window.innerHeight * 0.7)}px`;
    }
  }, [isInlineEditing, text]);

  return (
    <div
      className={`prompter-reading-screen ${
        settings.mirrorHorizontal && !isInlineEditing ? 'is-mirrored' : ''
      } ${settings.forceLandscape && !isInlineEditing ? 'force-landscape' : ''} ${
        settings.rotationAngle && !isInlineEditing ? `rotate-${settings.rotationAngle}` : ''
      } ${isInlineEditing ? 'is-inline-editing-active' : ''}`}
      onClick={onScreenClick || (() => {
        if (!showCountdown && !isInlineEditing) {
          onTogglePlay();
        }
      })}
      onMouseMove={onTriggerControls}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onWheel={onWheel}
    >
      {/* Contagem Regressiva */}
      {showCountdown && (
        <PrompterCountdown onComplete={onCountdownComplete} onCancel={onCountdownCancel} />
      )}

      {/* Alerta Flash / P2P */}
      {flashAlertMessage && (
        <div className="prompter-flash-banner">
          <span>{flashAlertMessage}</span>
        </div>
      )}

      {/* Notificação Toast */}
      {copiedNotification && (
        <div className="prompter-toast-alert reading-toast">
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Aviso de Hifenização / Limite de Fonte */}
      {warningMessage && (
        <div className="prompter-warning-banner">
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Viewport com Rolagem Contínua */}
      <div
        ref={scrollerRef}
        className="prompter-scroll-viewport"
        onScroll={onManualScroll}
      >
        <div
          className="prompter-text-column"
          style={{
            maxWidth: `${settings.maxWidth}px`,
            fontSize: `${settings.fontSize}px`,
            textAlign: settings.textAlign,
            textTransform: textTransformValue,
            fontWeight: 800,
          }}
        >
          {/* Espaçamento superior */}
          <div className="prompter-spacer-top" />

          {isInlineEditing ? (
            <textarea
              ref={inlineTextareaRef}
              className="prompter-inline-screen-textarea"
              value={text}
              onChange={(e) => onInlineTextChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="prompter-text-body">
              {scriptLines.map((line, idx) => (
                <div
                  key={idx}
                  className="prompter-text-line"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onToggleInlineEdit(idx);
                  }}
                >
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          )}

          {/* Espaçamento inferior */}
          <div className="prompter-spacer-bottom" />
        </div>
      </div>

      {/* Controles Flutuantes */}
      <PrompterControls
        visible={showControls}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onRestart={onRestart}
        settings={settings}
        onUpdateSetting={updateSetting}
        presets={presets}
        onApplyPreset={onApplyPreset}
        onSavePreset={onSavePreset}
        onSaveCurrentAsPreferred={onSaveCurrentAsPreferred}
        onSetPreferredPreset={onSetPreferredPreset}
        onDeletePreset={onDeletePreset}
        onShowToast={onShowToast}
        isWakeLocked={isWakeLocked}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onBackToEdit={onBackToEdit}
        isInlineEditing={isInlineEditing}
        onToggleInlineEdit={() => onToggleInlineEdit()}
        isRemoteConnected={isRemoteConnected}
        onOpenRemoteModal={onOpenRemoteModal}
        isP2PConnected={isP2PConnected}
        onOpenP2PModal={onOpenP2PModal}
        currentLine={activeLineIndex + 1}
        totalLines={scriptLines.length}
        estimatedSpeechTime={estimatedSpeechTime}
        maxSafeFontSize={maxSafeFontSize}
        onShowWarning={handleShowWarning}
      />
    </div>
  );
};
