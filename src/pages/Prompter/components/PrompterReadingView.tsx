import React, { useMemo, useState, useEffect } from 'react';
import { PrompterControls } from './PrompterControls';
import { PrompterCountdown } from './PrompterCountdown';
import type { PrompterSettings } from '../hooks/usePrompterStorage';
import { calculateMaxSafeFontSize } from '../utils/prompterFontSize';

interface PrompterReadingViewProps {
  text: string;
  scriptLines: string[];
  settings: PrompterSettings;
  updateSetting: <K extends keyof PrompterSettings>(key: K, value: PrompterSettings[K]) => void;
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
  const maxSafeFontSize = useMemo(() => {
    return calculateMaxSafeFontSize(text, containerWidth, 48);
  }, [text, containerWidth]);

  // Auto-ajuste de fonte ao carregar o roteiro: se o tamanho atual for maior que o seguro, reduz automaticamente
  useEffect(() => {
    if (maxSafeFontSize > 0 && settings.fontSize > maxSafeFontSize) {
      updateSetting('fontSize', maxSafeFontSize);
    }
  }, [maxSafeFontSize, settings.fontSize, updateSetting]);

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
      className={`prompter-reading-screen ${settings.mirrorHorizontal ? 'is-mirrored' : ''} ${
        settings.forceLandscape ? 'force-landscape' : ''
      } ${settings.rotationAngle ? `rotate-${settings.rotationAngle}` : ''} ${
        isInlineEditing ? 'is-inline-editing-active' : ''
      }`}
      onClick={() => {
        if (!showCountdown && !isInlineEditing) {
          onTogglePlay();
        }
      }}
      onMouseMove={onTriggerControls}
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
