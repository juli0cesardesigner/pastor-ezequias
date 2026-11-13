import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePrompterStorage } from './hooks/usePrompterStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { usePrompterCloud } from './hooks/usePrompterCloud';
import { usePrompterScroller } from './hooks/usePrompterScroller';
import { calculateSpeechTime, calculateScriptStats } from './utils/prompterSpeechTime';
import { p2pManager } from '../../services/prompterP2PService';
import { feelworldBle, type RemoteActionType } from '../../services/feelworldBleService';
import type { CloudScript } from '../../services/prompterService';

// Componentes Fragmentados
import { PrompterDashboard } from './components/PrompterDashboard';
import { PrompterEditorView } from './components/PrompterEditorView';
import { PrompterReadingView } from './components/PrompterReadingView';
import { PrompterCloudModal } from './components/PrompterCloudModal';
import { PrompterSaveCloudModal } from './components/PrompterSaveCloudModal';
import { PrompterDraftsDrawer } from './components/PrompterDraftsDrawer';
import { PrompterP2PModal } from './components/PrompterP2PModal';
import { PrompterRemoteModal } from './components/PrompterRemoteModal';
import { PrompterOperatorDeck } from './components/PrompterOperatorDeck';

import './PrompterPage.css';

export const PrompterPage: React.FC = () => {
  const {
    text,
    setText,
    settings,
    updateSetting,
    presets,
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
  } = usePrompterStorage();

  // Estados de navegação interna: dashboard | editor | reading
  const [mode, setMode] = useState<'dashboard' | 'editor' | 'reading'>('dashboard');

  // Hook isolado para banco na Nuvem (Neon DB)
  const cloud = usePrompterCloud();

  // Modais e gavetas
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showSaveCloudModal, setShowSaveCloudModal] = useState(false);
  const [showDraftsList, setShowDraftsList] = useState(false);
  const [draftTitleInput, setDraftTitleInput] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Estados de Leitura
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const savedRotationBeforeInlineEditRef = useRef<number | null>(null);

  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const showCountdownRef = useRef(showCountdown);
  showCountdownRef.current = showCountdown;

  // Array de linhas do roteiro memoizado
  const scriptLines = useMemo(() => text.split('\n'), [text]);

  // Visibilidade dos controles no leitor
  const triggerControlsVisibility = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => setShowControls(false), 2400);
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }

    if (showCountdownRef.current) {
      showCountdownRef.current = false;
      setShowCountdown(false);
      isPlayingRef.current = false;
      setIsPlaying(false);
      setShowControls(true);
      return;
    }

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setShowControls(true);
    } else {
      // A cada pausa, retomar inicia uma contagem regressiva de 3 segundos
      showCountdownRef.current = true;
      setShowCountdown(true);
      setShowControls(false);
    }
  }, []);

  const pauseReading = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setShowControls(true);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    showCountdownRef.current = false;
    setShowCountdown(false);
    isPlayingRef.current = true;
    setIsPlaying(true);
    setShowControls(false);
  }, []);

  const handleCountdownCancel = useCallback(() => {
    showCountdownRef.current = false;
    setShowCountdown(false);
    isPlayingRef.current = false;
    setIsPlaying(false);
    setShowControls(true);
  }, []);

  // Hook de Rolagem 60fps & Roleta
  const scroller = usePrompterScroller({
    mode,
    isPlaying,
    onTogglePlay: togglePlay,
    onPause: pauseReading,
    speed: settings.speed,
    showCountdown,
    isInlineEditing,
    forceLandscape: settings.forceLandscape,
    rotationAngle: settings.rotationAngle,
    fontSize: settings.fontSize,
    maxWidth: settings.maxWidth,
    scriptLinesCount: scriptLines.length,
    onActiveLineChange: setActiveLineIndex,
    onReachEnd: () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setShowControls(true);
    },
    onTriggerControls: triggerControlsVisibility,
  });

  // Wake Lock durante modo leitura
  const { isLocked: isWakeLocked } = useWakeLock(mode === 'reading');

  // Detecção de parâmetros de URL para Modo Operador Remoto
  const [isOperatorMode, setIsOperatorMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('role') === 'operator' || params.get('operator') === 'true' || !!params.get('room');
  });

  const [operatorRoomCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  });

  // Conexões P2P e Bluetooth
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [p2pRoomCode, setP2pRoomCode] = useState<string | null>(null);
  const [isP2PConnected] = useState(false);
  const [flashAlertMessage] = useState<string | null>(null);

  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(() => feelworldBle.isConnected());

  // Host P2P
  const handleStartHosting = useCallback(async (): Promise<string> => {
    const code = await p2pManager.startHost(p2pRoomCode || undefined);
    setP2pRoomCode(code);
    return code;
  }, [p2pRoomCode]);

  // Notificação toast temporária
  const showToast = useCallback((msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  }, []);

  // Tela cheia
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Ações de Início / Play / Pause
  const handleStartReading = useCallback(() => {
    if (!text.trim()) return;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setMode('reading');
    showCountdownRef.current = true;
    setShowCountdown(true);
    setShowControls(false);
    scroller.restart();
    if (!feelworldBle.isConnected()) feelworldBle.tryAutoConnectSilently().catch(() => {});
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  }, [text, scroller]);

  const handleRestart = useCallback(() => {
    scroller.restart();
    triggerControlsVisibility();
  }, [scroller, triggerControlsVisibility]);

  // Navegação de Volta
  const handleBackToEdit = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    showCountdownRef.current = false;
    setShowCountdown(false);
    setIsInlineEditing(false);
    setMode('editor');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const handleBackToDashboard = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    showCountdownRef.current = false;
    setShowCountdown(false);
    setIsInlineEditing(false);
    setMode('dashboard');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  // Seleção direta de roteiro pelo Dashboard
  const handlePlayScriptFromDashboard = useCallback((script: CloudScript) => {
    cloud.setActiveCloudScript(script);
    setText(script.content);
    isPlayingRef.current = false;
    setIsPlaying(false);
    setMode('reading');
    showCountdownRef.current = true;
    setShowCountdown(true);
    setShowControls(false);
    scroller.restart();
    if (!feelworldBle.isConnected()) feelworldBle.tryAutoConnectSilently().catch(() => {});
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  }, [cloud, setText, scroller]);

  const handleEditScriptFromDashboard = useCallback((script: CloudScript) => {
    cloud.setActiveCloudScript(script);
    setText(script.content);
    setMode('editor');
  }, [cloud, setText]);

  const handleNewScript = useCallback(() => {
    cloud.setActiveCloudScript(null);
    clearText();
    setMode('editor');
  }, [cloud, clearText]);

  // Exclusão com confirmação
  const handleDeleteCloudScript = useCallback(async (id: number, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o roteiro "${title}" da nuvem?`)) {
      await cloud.removeScript(id);
      showToast('Roteiro excluído com sucesso.');
    }
  }, [cloud, showToast]);

  // Salvar na Nuvem
  const handleConfirmSaveCloud = useCallback(async (data: { title: string; category?: string }) => {
    await cloud.saveScript({
      id: cloud.activeCloudScript?.id,
      title: data.title,
      category: data.category || 'Geral',
      content: text,
    });
    showToast('Roteiro salvo na nuvem com sucesso!');
  }, [cloud, text, showToast]);

  // Rascunho Local
  const handleSaveDraft = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const title = draftTitleInput.trim() || `Rascunho ${drafts.length + 1}`;
    saveCurrentAsDraft(title);
    setDraftTitleInput('');
    showToast('Rascunho local salvo!');
  }, [text, draftTitleInput, drafts.length, saveCurrentAsDraft, showToast]);

  // Integração Bluetooth Feelworld
  useEffect(() => {
    if (!feelworldBle.isConnected()) {
      feelworldBle.tryAutoConnectSilently().catch(() => {});
    }

    const unsubConn = feelworldBle.onConnectionChange(setIsRemoteConnected);
    const unsubAction = feelworldBle.onAction((action: RemoteActionType) => {
      if (mode === 'editor' && action === 'PLAY_PAUSE') {
        handleStartReading();
        return;
      }
      if (mode === 'reading') {
        switch (action) {
          case 'PLAY_PAUSE': togglePlay(); break;
          case 'SPEED_UP': updateSetting('speed', Math.min(100, settings.speed + 1)); triggerControlsVisibility(); break;
          case 'SPEED_DOWN': updateSetting('speed', Math.max(1, settings.speed - 1)); triggerControlsVisibility(); break;
          case 'FONT_UP': updateSetting('fontSize', Math.min(130, settings.fontSize + 1)); triggerControlsVisibility(); break;
          case 'FONT_DOWN': updateSetting('fontSize', Math.max(20, settings.fontSize - 1)); triggerControlsVisibility(); break;
          case 'RESTART': handleRestart(); triggerControlsVisibility(); break;
          case 'BACK_TO_EDITOR': handleBackToEdit(); break;
          case 'PREV_LINE': scroller.scrollToLine(scroller.activeLineIndexRef.current - 1, true); triggerControlsVisibility(); break;
          case 'NEXT_LINE': scroller.scrollToLine(scroller.activeLineIndexRef.current + 1, true); triggerControlsVisibility(); break;
        }
      }
    });

    return () => {
      unsubConn();
      unsubAction();
    };
  }, [mode, settings.speed, settings.fontSize, handleStartReading, togglePlay, updateSetting, handleRestart, handleBackToEdit, scroller, triggerControlsVisibility]);

  // Atalhos de teclado no Desktop e Controles Remotos Wireless/Bluetooth (HID)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se estiver digitando no editor principal, permitir apenas Ctrl/Cmd+Enter para iniciar
      if (mode === 'editor') {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          handleStartReading();
        }
        return;
      }

      // Se estiver no Modo Leitura e em edição inline ativa
      if (mode === 'reading' && isInlineEditing) {
        if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
          e.preventDefault();
          setIsInlineEditing(false);
          showToast('Texto salvo!');
        }
        return;
      }

      // Atalhos no Modo Leitura
      if (mode === 'reading') {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        } else if (e.code === 'ArrowUp') {
          e.preventDefault();
          if (isPlaying) {
            updateSetting('speed', Math.min(100, settings.speed + 1));
          } else {
            scroller.scrollToLine(scroller.activeLineIndexRef.current - 1, true);
          }
          triggerControlsVisibility();
        } else if (e.code === 'ArrowDown') {
          e.preventDefault();
          if (isPlaying) {
            updateSetting('speed', Math.max(1, settings.speed - 1));
          } else {
            scroller.scrollToLine(scroller.activeLineIndexRef.current + 1, true);
          }
          triggerControlsVisibility();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          scroller.scrollToLine(scroller.activeLineIndexRef.current - 1, true);
          triggerControlsVisibility();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          scroller.scrollToLine(scroller.activeLineIndexRef.current + 1, true);
          triggerControlsVisibility();
        } else if (e.code === 'PageUp') {
          e.preventDefault();
          scroller.scrollToLine(scroller.activeLineIndexRef.current - 5, true);
          triggerControlsVisibility();
        } else if (e.code === 'PageDown') {
          e.preventDefault();
          scroller.scrollToLine(scroller.activeLineIndexRef.current + 5, true);
          triggerControlsVisibility();
        } else if (e.code === 'Home') {
          e.preventDefault();
          scroller.scrollToLine(0, true);
          triggerControlsVisibility();
        } else if (e.code === 'End') {
          e.preventDefault();
          scroller.scrollToLine(scriptLines.length - 1, true);
          triggerControlsVisibility();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          updateSetting('speed', Math.min(100, settings.speed + 1));
          triggerControlsVisibility();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          updateSetting('speed', Math.max(1, settings.speed - 1));
          triggerControlsVisibility();
        } else if (e.key === '[' || e.key === '{') {
          e.preventDefault();
          updateSetting('fontSize', Math.max(20, settings.fontSize - 1));
          triggerControlsVisibility();
        } else if (e.key === ']' || e.key === '}') {
          e.preventDefault();
          updateSetting('fontSize', Math.min(130, settings.fontSize + 1));
          triggerControlsVisibility();
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setIsInlineEditing((prev) => !prev);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handleRestart();
        } else if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          const currentAngle = settings.rotationAngle !== undefined ? settings.rotationAngle : (settings.forceLandscape ? 90 : 0);
          const isLandscape = currentAngle === 90 || currentAngle === 270;
          const nextAngle = isLandscape ? 0 : 90;
          updateSetting('rotationAngle', nextAngle);
          updateSetting('forceLandscape', nextAngle === 90);
          triggerControlsVisibility();
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          const currentAngle = settings.rotationAngle !== undefined ? settings.rotationAngle : (settings.forceLandscape ? 90 : 0);
          const nextAngle = (currentAngle + 180) % 360;
          updateSetting('rotationAngle', nextAngle);
          updateSetting('forceLandscape', nextAngle === 90 || nextAngle === 270);
          triggerControlsVisibility();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          toggleFullscreen();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleBackToEdit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode,
    isInlineEditing,
    isPlaying,
    settings.speed,
    settings.fontSize,
    settings.rotationAngle,
    settings.forceLandscape,
    scriptLines.length,
    handleStartReading,
    togglePlay,
    updateSetting,
    triggerControlsVisibility,
    handleRestart,
    toggleFullscreen,
    handleBackToEdit,
    scroller,
    showToast,
  ]);

  // Se a rota for aberta como Operador Remoto
  if (isOperatorMode) {
    return (
      <div className="prompter-operator-fullscreen-wrapper">
        <PrompterOperatorDeck
          initialRoomCode={operatorRoomCode}
          onExitOperatorMode={() => setIsOperatorMode(false)}
        />
      </div>
    );
  }

  const estimatedSpeechTime = calculateSpeechTime(calculateScriptStats(text).words, settings.speed);

  return (
    <div className="prompter-container-master">
      {/* 1. MODO HOME / DASHBOARD */}
      {mode === 'dashboard' && (
        <PrompterDashboard
          cloudScripts={cloud.cloudScripts}
          filteredCloudScripts={cloud.filteredCloudScripts}
          isLoadingCloud={cloud.isLoadingCloud}
          cloudError={cloud.cloudError}
          onRefreshCloud={cloud.loadCloudScripts}
          onNewScript={handleNewScript}
          onEditScript={handleEditScriptFromDashboard}
          onPlayScript={handlePlayScriptFromDashboard}
          onDeleteScript={handleDeleteCloudScript}
          searchQuery={cloud.searchQuery}
          onSearchChange={cloud.setSearchQuery}
          isRemoteConnected={isRemoteConnected}
          onOpenRemoteModal={() => setShowRemoteModal(true)}
          isP2PConnected={isP2PConnected}
          onOpenP2PModal={() => setShowP2PModal(true)}
          drafts={drafts}
          onOpenDrafts={() => setShowDraftsList(true)}
          onOpenSettings={() => {
            setMode('editor');
          }}
          speed={settings.speed}
        />
      )}

      {/* 2. MODO EDITOR */}
      {mode === 'editor' && (
        <PrompterEditorView
          text={text}
          onTextChange={setText}
          settings={settings}
          onUpdateSetting={updateSetting}
          presets={presets}
          onApplyPreset={applyPreset}
          onSavePreset={savePreset}
          onSaveCurrentAsPreferred={saveCurrentAsPreferred}
          onSetPreferredPreset={setPreferredPreset}
          onDeletePreset={deletePreset}
          onShowToast={showToast}
          activeCloudScript={cloud.activeCloudScript}
          cloudScriptsCount={cloud.cloudScripts.length}
          draftsCount={drafts.length}
          onBackToDashboard={handleBackToDashboard}
          onStartReading={handleStartReading}
          onOpenCloudModal={() => setShowCloudModal(true)}
          onOpenSaveCloudModal={() => setShowSaveCloudModal(true)}
          onOpenRemoteModal={() => setShowRemoteModal(true)}
          onOpenP2PModal={() => setShowP2PModal(true)}
          onToggleDraftsList={() => setShowDraftsList((prev) => !prev)}
          onClearText={() => {
            if (window.confirm('Deseja limpar o texto da tela?')) {
              clearText();
              cloud.setActiveCloudScript(null);
            }
          }}
          onOpenOperatorMode={() => setIsOperatorMode(true)}
          isRemoteConnected={isRemoteConnected}
          isP2PConnected={isP2PConnected}
          copiedNotification={copiedNotification}
          editorTextareaRef={editorTextareaRef}
        />
      )}

      {/* 3. MODO LEITURA */}
      {mode === 'reading' && (
        <PrompterReadingView
          text={text}
          scriptLines={scriptLines}
          settings={settings}
          updateSetting={updateSetting}
          presets={presets}
          onApplyPreset={applyPreset}
          onSavePreset={savePreset}
          onSaveCurrentAsPreferred={saveCurrentAsPreferred}
          onSetPreferredPreset={setPreferredPreset}
          onDeletePreset={deletePreset}
          onShowToast={showToast}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onRestart={handleRestart}
          showCountdown={showCountdown}
          onCountdownComplete={handleCountdownComplete}
          onCountdownCancel={handleCountdownCancel}
          showControls={showControls}
          onTriggerControls={triggerControlsVisibility}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          activeLineIndex={activeLineIndex}
          scrollerRef={scroller.scrollerRef}
          onScrollToLine={scroller.scrollToLine}
          onManualScroll={scroller.handleManualScroll}
          onWheel={scroller.handleWheel}
          onTouchStart={scroller.handleTouchStart}
          onTouchMove={scroller.handleTouchMove}
          onTouchEnd={scroller.handleTouchEnd}
          onScreenClick={scroller.handleScreenClick}
          isInlineEditing={isInlineEditing}
          onToggleInlineEdit={() => {
            setIsInlineEditing((prev) => {
              const next = !prev;
              if (next) {
                isPlayingRef.current = false;
                setIsPlaying(false);
                showCountdownRef.current = false;
                setShowCountdown(false);
                // Entrando na edição: salva a rotação atual e força 0° para edição natural
                savedRotationBeforeInlineEditRef.current = settings.rotationAngle || (settings.forceLandscape ? 90 : 0);
                if (savedRotationBeforeInlineEditRef.current !== 0) {
                  updateSetting('rotationAngle', 0);
                  updateSetting('forceLandscape', false);
                }
              } else {
                // Concluindo a edição: restaura a rotação anterior (0°, 90°, 180° ou 270°)
                if (savedRotationBeforeInlineEditRef.current !== null) {
                  const restored = savedRotationBeforeInlineEditRef.current;
                  updateSetting('rotationAngle', restored);
                  updateSetting('forceLandscape', restored === 90 || restored === 270);
                  savedRotationBeforeInlineEditRef.current = null;
                }
              }
              return next;
            });
          }}
          inlineTextareaRef={inlineTextareaRef}
          onInlineTextChange={setText}
          isWakeLocked={isWakeLocked}
          isRemoteConnected={isRemoteConnected}
          onOpenRemoteModal={() => setShowRemoteModal(true)}
          isP2PConnected={isP2PConnected}
          onOpenP2PModal={() => setShowP2PModal(true)}
          onBackToEdit={handleBackToEdit}
          flashAlertMessage={flashAlertMessage}
          copiedNotification={copiedNotification}
          estimatedSpeechTime={estimatedSpeechTime}
        />
      )}

      {/* PAINÉIS E MODAIS MODULARES */}
      <PrompterCloudModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        cloudScripts={cloud.cloudScripts}
        filteredCloudScripts={cloud.filteredCloudScripts}
        isLoading={cloud.isLoadingCloud}
        error={cloud.cloudError}
        activeScriptId={cloud.activeCloudScript?.id || null}
        searchQuery={cloud.searchQuery}
        onSearchChange={cloud.setSearchQuery}
        onRefresh={cloud.loadCloudScripts}
        onLoadScript={(s) => {
          cloud.setActiveCloudScript(s);
          setText(s.content);
          setShowCloudModal(false);
        }}
        onPlayScript={(s) => {
          setShowCloudModal(false);
          handlePlayScriptFromDashboard(s);
        }}
        onDeleteScript={handleDeleteCloudScript}
        onOpenSaveNew={() => setShowSaveCloudModal(true)}
        hasCurrentText={!!text.trim()}
        speed={settings.speed}
      />

      <PrompterSaveCloudModal
        isOpen={showSaveCloudModal}
        onClose={() => setShowSaveCloudModal(false)}
        text={text}
        speed={settings.speed}
        activeCloudScript={cloud.activeCloudScript}
        onConfirmSave={handleConfirmSaveCloud}
      />

      <PrompterDraftsDrawer
        isOpen={showDraftsList}
        onClose={() => setShowDraftsList(false)}
        drafts={drafts}
        draftTitleInput={draftTitleInput}
        onDraftTitleChange={setDraftTitleInput}
        onSaveDraft={handleSaveDraft}
        onLoadDraft={(d) => {
          loadDraft(d);
          cloud.setActiveCloudScript(null);
          setShowDraftsList(false);
          if (mode === 'dashboard') setMode('editor');
        }}
        onDeleteDraft={deleteDraft}
        canSave={!!text.trim()}
      />

      {showRemoteModal && (
        <PrompterRemoteModal
          isOpen={showRemoteModal}
          onClose={() => setShowRemoteModal(false)}
        />
      )}

      {showP2PModal && (
        <PrompterP2PModal
          isOpen={showP2PModal}
          onClose={() => setShowP2PModal(false)}
          currentRoomCode={p2pRoomCode}
          onStartHosting={handleStartHosting}
          isConnected={isP2PConnected}
        />
      )}
    </div>
  );
};
