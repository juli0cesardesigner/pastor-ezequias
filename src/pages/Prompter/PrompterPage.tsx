import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Trash2,
  Bookmark,
  Clock,
  FileText,
  Check,
  Zap,
  Cloud,
  CloudUpload,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { usePrompterStorage } from './hooks/usePrompterStorage';
import { useWakeLock } from './hooks/useWakeLock';
import {
  fetchCloudScripts,
  saveCloudScript,
  deleteCloudScript,
  type CloudScript,
} from '../../services/prompterService';
import { PrompterControls } from './components/PrompterControls';
import { PrompterCountdown } from './components/PrompterCountdown';
import './PrompterPage.css';

const SCRIPT_CATEGORIES = [
  'Todos',
  'Mensagem Pastoral',
  'Vídeo / Redes Sociais',
  'Discurso / Evento',
  'Saudação / Convite',
  'Geral',
];

export const PrompterPage: React.FC = () => {
  const {
    text,
    setText,
    settings,
    updateSetting,
    drafts,
    saveCurrentAsDraft,
    loadDraft,
    deleteDraft,
    clearText,
  } = usePrompterStorage();

  const [mode, setMode] = useState<'editor' | 'reading'>('editor');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Rascunhos locais
  const [draftTitleInput, setDraftTitleInput] = useState<string>('');
  const [showDraftsList, setShowDraftsList] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Banco de Dados Neon (Nuvem)
  const [cloudScripts, setCloudScripts] = useState<CloudScript[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);
  const [showSaveCloudModal, setShowSaveCloudModal] = useState<boolean>(false);
  const [activeCloudScript, setActiveCloudScript] = useState<CloudScript | null>(null);

  // Formulário Salvar na Nuvem
  const [cloudTitle, setCloudTitle] = useState<string>('');
  const [cloudCategory, setCloudCategory] = useState<string>('Mensagem Pastoral');
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);

  // Busca e filtros na Nuvem
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Estado para Edição Direta no Modo Leitura
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentScrollRef = useRef<number>(0);
  const hideControlsTimerRef = useRef<number | null>(null);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startScroll: number;
    isDragging: boolean;
  } | null>(null);

  // Ativar Wake Lock durante modo leitura
  const { isLocked: isWakeLocked } = useWakeLock(mode === 'reading');

  // Carregar roteiros da nuvem ao iniciar
  const loadCloudScripts = useCallback(async () => {
    setIsLoadingCloud(true);
    setCloudError(null);
    try {
      const data = await fetchCloudScripts();
      setCloudScripts(data);
    } catch (err) {
      console.error('Erro ao conectar ao Neon DB:', err);
      setCloudError('Não foi possível sincronizar com o banco.');
    } finally {
      setIsLoadingCloud(false);
    }
  }, []);

  useEffect(() => {
    loadCloudScripts();
  }, [loadCloudScripts]);

  // Estatísticas do texto (palavras e caracteres)
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { words: 0, characters: 0 };
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const characters = trimmed.length;
    return { words, characters };
  }, [text]);

  // Cálculo de tempo de fala dinâmico combinando palavras + velocidade configurada
  const calculateSpeechTime = useCallback((wordsCount: number, speed: number = settings.speed): string => {
    if (wordsCount <= 0) return '~0s';
    // Calibração: WPM varia proporcionalmente à velocidade ajustada no slider (1 a 100)
    // Velocidade 28 (padrão) = ~130 WPM (ritmo natural de locução)
    const wpm = Math.max(60, Math.round(80 + (speed * 1.8)));
    const totalSeconds = Math.round((wordsCount / wpm) * 60);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `~${seconds}s`;
    }
    if (seconds === 0) {
      return `~${minutes}m`;
    }
    return `~${minutes}m ${seconds}s`;
  }, [settings.speed]);

  const estimatedSpeechTime = useMemo(() => {
    return calculateSpeechTime(stats.words, settings.speed);
  }, [stats.words, settings.speed, calculateSpeechTime]);

  // Reiniciar temporizador de ocultação da barra de controle
  const triggerControlsVisibility = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 2400);
    }
  }, [isPlaying]);

  // Manipulação de Tela Cheia
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignorar erros de permissão de fullscreen
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Iniciar leitura
  const handleStartReading = useCallback(() => {
    if (!text.trim()) return;
    setMode('reading');
    setShowCountdown(true);
    setShowControls(false);
    currentScrollRef.current = 0;
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [text]);

  // Concluir contagem regressiva
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsPlaying(true);
    setShowControls(false);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
  };

  // Alternar Play/Pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        // Ao clicar no PLAY (iniciar reprodução): ocultar IMEDIATAMENTE todos os botões
        lastTimeRef.current = null;
        setShowControls(false);
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
        }
      } else {
        // Ao pausar: exibir botões de controle
        setShowControls(true);
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
        }
      }
      return next;
    });
  }, []);

  // Reiniciar rolagem ao topo
  const handleRestart = useCallback(() => {
    currentScrollRef.current = 0;
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
    triggerControlsVisibility();
  }, [triggerControlsVisibility]);

  // Voltar ao Editor
  const handleBackToEdit = useCallback(() => {
    setIsPlaying(false);
    setShowCountdown(false);
    setIsInlineEditing(false);
    setMode('editor');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Alternar modo de edição direta na tela
  const handleToggleInlineEdit = useCallback(() => {
    setIsInlineEditing((prev) => {
      const next = !prev;
      if (next) {
        setIsPlaying(false);
      } else {
        setCopiedNotification('Texto salvo!');
        setTimeout(() => setCopiedNotification(null), 2000);
      }
      return next;
    });
  }, []);

  // Ajustar altura da textarea quando entrar em modo de edição direta na tela
  useEffect(() => {
    if (isInlineEditing && inlineTextareaRef.current) {
      const el = inlineTextareaRef.current;
      el.style.height = `${Math.max(window.innerHeight * 0.8, el.scrollHeight + 150)}px`;
      el.focus();
    }
  }, [isInlineEditing]);

  // Motor de rolagem contínua a 60fps usando requestAnimationFrame
  useEffect(() => {
    if (mode !== 'reading' || !isPlaying || showCountdown) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
      return;
    }

    const scrollLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Velocidade calculada em pixels por segundo
      // speed 1 = ~12px/s, speed 100 = ~370px/s
      const pixelsPerSecond = 12 + (settings.speed / 100) * 360;
      currentScrollRef.current += pixelsPerSecond * delta;

      if (scrollerRef.current) {
        scrollerRef.current.scrollTop = currentScrollRef.current;

        // Se chegou ao final do conteúdo
        const maxScroll = scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight;
        if (currentScrollRef.current >= maxScroll && maxScroll > 0) {
          setIsPlaying(false);
          setShowControls(true);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    animationFrameRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode, isPlaying, showCountdown, settings.speed]);

  // Sincronizar scroll quando o usuário rolar manualmente com o dedo/mouse
  const handleManualScroll = () => {
    if (scrollerRef.current && !touchStateRef.current?.isDragging) {
      currentScrollRef.current = scrollerRef.current.scrollTop;
    }
  };

  // Gestos de Touch para percorrer o script (para cima / para baixo) em qualquer orientação
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && scrollerRef.current) {
      touchStateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startScroll: scrollerRef.current.scrollTop,
        isDragging: false,
      };
    }
    triggerControlsVisibility();
  }, [triggerControlsVisibility]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStateRef.current || !scrollerRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const totalDx = currentX - touchStateRef.current.startX;
    const totalDy = currentY - touchStateRef.current.startY;

    if (!touchStateRef.current.isDragging && (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5)) {
      touchStateRef.current.isDragging = true;
    }

    if (touchStateRef.current.isDragging) {
      let scrollDelta = 0;
      if (settings.forceLandscape) {
        // No modo paisagem forçado (90°): arrastar o dedo para frente (totalDx > 0) avança o texto para baixo
        if (Math.abs(totalDx) >= Math.abs(totalDy)) {
          scrollDelta = totalDx * 1.5;
        } else {
          scrollDelta = -totalDy * 1.5;
        }
      } else {
        // No modo retrato: arrastar para cima (-totalDy > 0) avança o texto para baixo
        scrollDelta = -totalDy * 1.3;
      }

      const maxScroll = scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight;
      const targetScroll = Math.max(0, Math.min(maxScroll, touchStateRef.current.startScroll + scrollDelta));
      scrollerRef.current.scrollTop = targetScroll;
      currentScrollRef.current = targetScroll;
    }
  }, [settings.forceLandscape]);

  const handleTouchEnd = useCallback(() => {
    if (touchStateRef.current?.isDragging) {
      setTimeout(() => {
        if (touchStateRef.current) {
          touchStateRef.current.isDragging = false;
        }
      }, 100);
    }
  }, []);

  // Rolagem por mousewheel / trackpad
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!scrollerRef.current) return;
    const delta = e.deltaY || e.deltaX;
    const maxScroll = scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight;
    const targetScroll = Math.max(0, Math.min(maxScroll, scrollerRef.current.scrollTop + delta));
    scrollerRef.current.scrollTop = targetScroll;
    currentScrollRef.current = targetScroll;
    triggerControlsVisibility();
  }, [triggerControlsVisibility]);

  // Atalhos de teclado no Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se estiver digitando no editor principal, não interceptar
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
          setCopiedNotification('Texto salvo!');
          setTimeout(() => setCopiedNotification(null), 2000);
        }
        return;
      }

      // Atalhos no Modo Leitura
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        updateSetting('speed', Math.min(100, settings.speed + 2));
        triggerControlsVisibility();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        updateSetting('speed', Math.max(1, settings.speed - 2));
        triggerControlsVisibility();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (scrollerRef.current) {
          currentScrollRef.current = Math.max(0, currentScrollRef.current - 220);
          scrollerRef.current.scrollTop = currentScrollRef.current;
        }
        triggerControlsVisibility();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (scrollerRef.current) {
          currentScrollRef.current += 220;
          scrollerRef.current.scrollTop = currentScrollRef.current;
        }
        triggerControlsVisibility();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleToggleInlineEdit();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        updateSetting('forceLandscape', !settings.forceLandscape);
        triggerControlsVisibility();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleBackToEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode,
    isInlineEditing,
    settings.speed,
    settings.forceLandscape,
    handleStartReading,
    handleToggleInlineEdit,
    togglePlay,
    updateSetting,
    triggerControlsVisibility,
    handleRestart,
    toggleFullscreen,
    handleBackToEdit,
  ]);

  // Sincronizar bloqueio de orientação de tela do dispositivo quando suportado
  useEffect(() => {
    if (mode === 'reading' && settings.forceLandscape) {
      try {
        // @ts-ignore - Screen Orientation API
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
          // @ts-ignore
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch {
        // Ignorar em navegadores sem suporte
      }
    } else {
      try {
        // @ts-ignore
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          // @ts-ignore
          screen.orientation.unlock();
        }
      } catch {
        // Ignorar
      }
    }

    return () => {
      try {
        // @ts-ignore
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          // @ts-ignore
          screen.orientation.unlock();
        }
      } catch {
        // Ignorar
      }
    };
  }, [mode, settings.forceLandscape]);

  // Iniciar toque na tela de leitura (apenas se não estiver arrastando/scrollando ou editando)
  const handleScreenClick = useCallback(() => {
    if (mode !== 'reading') return;
    if (showCountdown) return;
    if (isInlineEditing) return;
    if (touchStateRef.current?.isDragging) return;
    togglePlay();
  }, [mode, showCountdown, isInlineEditing, togglePlay]);

  // Abrir modal de salvar na nuvem
  const handleOpenSaveCloudModal = (existing?: CloudScript | null) => {
    if (existing) {
      setCloudTitle(existing.title);
      setCloudCategory(existing.category);
    } else if (activeCloudScript) {
      setCloudTitle(activeCloudScript.title);
      setCloudCategory(activeCloudScript.category);
    } else {
      const firstLine = text.trim().split('\n')[0] || '';
      setCloudTitle(firstLine.slice(0, 45) || 'Roteiro ' + new Date().toLocaleDateString());
      setCloudCategory('Mensagem Pastoral');
    }
    setShowSaveCloudModal(true);
  };

  // Salvar no Banco Neon
  const handleConfirmSaveCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSavingCloud(true);
    try {
      const saved = await saveCloudScript({
        id: activeCloudScript ? activeCloudScript.id : null,
        title: cloudTitle,
        content: text,
        category: cloudCategory,
      });

      setActiveCloudScript(saved);
      setShowSaveCloudModal(false);
      await loadCloudScripts();
      setCopiedNotification('Salvo no banco de dados com sucesso!');
      setTimeout(() => setCopiedNotification(null), 3000);
    } catch {
      alert('Erro ao salvar no banco. Verifique sua conexão.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Carregar roteiro da nuvem para o editor
  const handleLoadCloudScript = (script: CloudScript) => {
    setText(script.content);
    setActiveCloudScript(script);
    setShowCloudModal(false);
    setCopiedNotification(`"${script.title}" carregado!`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Carregar e iniciar leitura imediatamente
  const handlePlayCloudScript = (script: CloudScript) => {
    setText(script.content);
    setActiveCloudScript(script);
    setShowCloudModal(false);
    setTimeout(() => {
      handleStartReading();
    }, 100);
  };

  // Excluir roteiro da nuvem
  const handleDeleteCloudScript = async (id: number, title: string) => {
    if (!window.confirm(`Deseja realmente excluir o roteiro "${title}" da nuvem?`)) return;
    try {
      await deleteCloudScript(id);
      if (activeCloudScript?.id === id) {
        setActiveCloudScript(null);
      }
      setCloudScripts((prev) => prev.filter((s) => s.id !== id));
      setCopiedNotification('Roteiro removido da nuvem.');
      setTimeout(() => setCopiedNotification(null), 2500);
    } catch {
      alert('Erro ao excluir roteiro.');
    }
  };

  // Manipular salvar rascunho local
  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentAsDraft(draftTitleInput);
    setDraftTitleInput('');
    setCopiedNotification('Rascunho local salvo!');
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Filtro de roteiros da nuvem
  const filteredCloudScripts = useMemo(() => {
    return cloudScripts.filter((s) => {
      const matchCategory = selectedCategory === 'Todos' || s.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [cloudScripts, selectedCategory, searchQuery]);


  return (
    <div className={`prompter-app-wrapper theme-oled ${settings.textColor}-color ${settings.forceLandscape ? 'is-forced-landscape' : ''}`}>
      {/* ======================================================== */}
      {/* MODO EDITOR                                              */}
      {/* ======================================================== */}
      {mode === 'editor' && (
        <div className="prompter-editor-container">
          <header className="prompter-editor-header">
            <div className="prompter-header-brand">
              <div className="prompter-badge-tag">
                <Zap size={14} className="text-amber" />
                <span>Teleprompter</span>
                <span className="dot-divider">•</span>
                <button
                  type="button"
                  className="cloud-status-pill"
                  onClick={() => setShowCloudModal(true)}
                  title="Abrir Banco de Roteiros Compartilhados"
                >
                  <Cloud size={13} className="text-amber" />
                  <span>Nuvem ({cloudScripts.length})</span>
                </button>
              </div>
              <h1 className="prompter-title">
                {activeCloudScript ? activeCloudScript.title : 'Roteiro de Leitura'}
              </h1>
            </div>

            <div className="prompter-header-stats">
              <div className="stat-pill" title="Contagem de palavras">
                <FileText size={15} />
                <span><strong>{stats.words}</strong> pal.</span>
              </div>
              <div className="stat-pill highlight" title="Tempo estimado de fala baseado nas palavras e velocidade atual">
                <Clock size={15} />
                <span><strong>{estimatedSpeechTime}</strong></span>
              </div>
            </div>
          </header>

          <main className="prompter-editor-main">
            <div className="editor-textarea-wrapper">
              <textarea
                className="prompter-textarea"
                placeholder="Cole ou digite aqui seu texto para o teleprompter...

Qualquer membro da equipe pode salvar e carregar roteiros em tempo real pela Nuvem!"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                autoFocus
              />

              <div className="textarea-quick-actions">
                <div className="left-actions">
                  <button
                    type="button"
                    className="action-pill-btn cloud-btn"
                    onClick={() => setShowCloudModal(true)}
                  >
                    <Cloud size={14} />
                    <span>Roteiros na Nuvem ({cloudScripts.length})</span>
                  </button>

                  {text.trim().length > 0 && (
                    <button
                      type="button"
                      className="action-pill-btn highlight"
                      onClick={() => handleOpenSaveCloudModal(null)}
                    >
                      <CloudUpload size={14} />
                      <span>{activeCloudScript ? 'Atualizar Nuvem' : 'Salvar na Nuvem'}</span>
                    </button>
                  )}
                </div>

                <div className="right-actions">
                  {text.trim().length > 0 && (
                    <>
                      <button
                        type="button"
                        className="action-pill-btn"
                        onClick={() => setShowDraftsList(!showDraftsList)}
                      >
                        <Bookmark size={14} />
                        <span>Rascunhos Locais ({drafts.length})</span>
                      </button>
                      <button
                        type="button"
                        className="action-pill-btn danger"
                        onClick={() => {
                          if (window.confirm('Deseja limpar o texto da tela?')) {
                            clearText();
                            setActiveCloudScript(null);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Limpar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notificação Toast */}
            {copiedNotification && (
              <div className="prompter-toast-alert">
                <Check size={16} />
                <span>{copiedNotification}</span>
              </div>
            )}

            {/* Painel de Rascunhos Locais */}
            {showDraftsList && (
              <div className="drafts-drawer-card">
                <div className="drafts-card-header">
                  <div className="drafts-title">
                    <Bookmark size={16} className="text-amber" />
                    <span>Rascunhos Salvos neste Navegador</span>
                  </div>
                  <button
                    type="button"
                    className="close-sm-btn"
                    onClick={() => setShowDraftsList(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveDraft} className="draft-save-form">
                  <input
                    type="text"
                    placeholder="Nome do rascunho local..."
                    value={draftTitleInput}
                    onChange={(e) => setDraftTitleInput(e.target.value)}
                    className="draft-input"
                  />
                  <button type="submit" className="save-draft-btn" disabled={!text.trim()}>
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
                          onClick={() => {
                            loadDraft(draft);
                            setActiveCloudScript(null);
                            setShowDraftsList(false);
                          }}
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
                          onClick={() => deleteDraft(draft.id)}
                          title="Excluir rascunho"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>

          <footer className="prompter-editor-footer">
            <div className="prompter-settings-preview">
              <span className="settings-summary-item">
                Fonte: <strong>{settings.fontSize}px</strong>
              </span>
              <span className="settings-summary-item">
                Velocidade: <strong>{settings.speed}</strong>
              </span>
              <span className="settings-summary-item">
                Largura: <strong>{settings.maxWidth}px</strong>
              </span>
            </div>

            <div className="prompter-primary-actions">
              <button
                type="button"
                className="prompter-start-btn"
                disabled={!text.trim()}
                onClick={handleStartReading}
              >
                <Play size={22} className="play-icon-offset" />
                <span>Iniciar Teleprompter</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE ROTEIROS NA NUVEM (NEON DB)                     */}
      {/* ======================================================== */}
      {showCloudModal && (
        <div className="prompter-modal-backdrop" onClick={() => setShowCloudModal(false)}>
          <div className="prompter-cloud-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <div className="cloud-icon-badge">
                  <Cloud size={20} className="text-amber" />
                </div>
                <div>
                  <h2 className="modal-title">Roteiros na Nuvem</h2>
                  <p className="modal-subtitle">
                    Acessíveis em tempo real de qualquer celular, tablet ou computador.
                  </p>
                </div>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={loadCloudScripts}
                  title="Atualizar lista"
                  disabled={isLoadingCloud}
                >
                  <RefreshCw size={18} className={isLoadingCloud ? 'spin-anim' : ''} />
                </button>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setShowCloudModal(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-search-bar">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, categoria ou trecho..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Categorias Pills */}
            <div className="category-filter-pills">
              {SCRIPT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {cloudError && (
              <div className="cloud-error-banner">
                <AlertCircle size={16} />
                <span>{cloudError}</span>
                <button type="button" onClick={loadCloudScripts} className="retry-btn">
                  Tentar novamente
                </button>
              </div>
            )}

            <div className="cloud-scripts-list">
              {isLoadingCloud && cloudScripts.length === 0 ? (
                <div className="cloud-loading-state">
                  <RefreshCw size={24} className="spin-anim text-amber" />
                  <p>Conectando ao banco de dados...</p>
                </div>
              ) : filteredCloudScripts.length === 0 ? (
                <div className="cloud-empty-state">
                  <FileText size={36} className="text-zinc" />
                  <h3>Nenhum roteiro encontrado</h3>
                  <p>
                    {searchQuery
                      ? 'Nenhum resultado para os termos pesquisados.'
                      : 'Crie seu primeiro roteiro e salve na nuvem para usar em qualquer lugar!'}
                  </p>
                  {text.trim() && (
                    <button
                      type="button"
                      className="create-cloud-btn"
                      onClick={() => {
                        setShowCloudModal(false);
                        handleOpenSaveCloudModal();
                      }}
                    >
                      <Plus size={16} /> Salvar Texto Atual na Nuvem
                    </button>
                  )}
                </div>
              ) : (
                filteredCloudScripts.map((script) => {
                  const words = script.content.trim().split(/\s+/).filter(Boolean).length;
                  const scriptSpeechTime = calculateSpeechTime(words, settings.speed);
                  const isCurrent = activeCloudScript?.id === script.id;

                  return (
                    <div
                      key={script.id}
                      className={`cloud-script-card ${isCurrent ? 'is-current' : ''}`}
                    >
                      <div className="script-card-header">
                        <span className="script-card-category">
                          <Tag size={12} /> {script.category}
                        </span>
                        <span className="script-card-date">{script.updatedAt}</span>
                      </div>

                      <h3 className="script-card-title">{script.title}</h3>
                      <p className="script-card-preview">{script.content.slice(0, 140)}...</p>

                      <div className="script-card-footer">
                        <div className="script-stats">
                          <span><strong>{words}</strong> palavras</span>
                          <span className="dot">•</span>
                          <span><strong>{scriptSpeechTime}</strong></span>
                        </div>

                        <div className="script-card-buttons">
                          <button
                            type="button"
                            className="card-btn delete"
                            onClick={() => handleDeleteCloudScript(script.id, script.title)}
                            title="Excluir da nuvem"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="card-btn edit"
                            onClick={() => handleLoadCloudScript(script)}
                            title="Carregar no Editor"
                          >
                            <Edit size={16} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="card-btn play"
                            onClick={() => handlePlayCloudScript(script)}
                            title="Iniciar Teleprompter Direto"
                          >
                            <Play size={16} className="play-icon-offset" />
                            <span>Ler Agora</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL SALVAR NA NUVEM                                    */}
      {/* ======================================================== */}
      {showSaveCloudModal && (
        <div className="prompter-modal-backdrop" onClick={() => setShowSaveCloudModal(false)}>
          <div className="prompter-save-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-group">
                <CloudUpload size={22} className="text-amber" />
                <h2 className="modal-title">
                  {activeCloudScript ? 'Atualizar na Nuvem' : 'Salvar Novo Roteiro'}
                </h2>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowSaveCloudModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSaveCloud} className="save-cloud-form">
              <div className="form-field">
                <label>Título do Roteiro</label>
                <input
                  type="text"
                  placeholder="Ex: Mensagem Domingo 19h..."
                  value={cloudTitle}
                  onChange={(e) => setCloudTitle(e.target.value)}
                  required
                  autoFocus
                  className="modal-input"
                />
              </div>

              <div className="form-field">
                <label>Categoria</label>
                <select
                  value={cloudCategory}
                  onChange={(e) => setCloudCategory(e.target.value)}
                  className="modal-select"
                >
                  {SCRIPT_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-preview-box">
                <div className="preview-label">
                  <span>Prévia ({stats.words} palavras • {estimatedSpeechTime})</span>
                </div>
                <p className="preview-content">{text.slice(0, 180)}...</p>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowSaveCloudModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="confirm-save-btn"
                  disabled={isSavingCloud || !cloudTitle.trim()}
                >
                  {isSavingCloud ? (
                    <>
                      <RefreshCw size={16} className="spin-anim" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CloudUpload size={16} /> Salvar no Banco
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODO LEITURA / PROMPTER                                  */}
      {/* ======================================================== */}
      {mode === 'reading' && (
        <div
          className={`prompter-reading-screen ${settings.mirrorHorizontal ? 'is-mirrored' : ''} ${settings.forceLandscape ? 'force-landscape' : ''}`}
          onClick={handleScreenClick}
          onMouseMove={triggerControlsVisibility}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Contagem regressiva */}
          {showCountdown && (
            <PrompterCountdown
              onComplete={handleCountdownComplete}
              onCancel={handleBackToEdit}
            />
          )}

          {/* Guia / Marcador Visual de Leitura Central */}
          {settings.lineGuide && !showCountdown && (
            <div className="prompter-focus-line-guide" pointer-events="none">
              <div className="guide-arrow left">▶</div>
              <div className="guide-band" />
              <div className="guide-arrow right">◀</div>
            </div>
          )}

          {/* Área com rolagem de texto */}
          <div
            ref={scrollerRef}
            className="prompter-scroll-viewport"
            onScroll={handleManualScroll}
          >
            <div
              className="prompter-text-column"
              style={{
                maxWidth: `${settings.maxWidth}px`,
                fontSize: `${settings.fontSize}px`,
                textAlign: settings.textAlign,
              }}
            >
              {/* Espaçamento superior para o texto iniciar na altura da linha guia */}
              <div className="prompter-spacer-top" />

              {/* Corpo do Texto / Editor Inline */}
              {isInlineEditing ? (
                <textarea
                  ref={inlineTextareaRef}
                  className="prompter-inline-screen-textarea"
                  value={text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setText(val);
                    if (e.target.scrollHeight > e.target.clientHeight) {
                      e.target.style.height = `${e.target.scrollHeight + 100}px`;
                    }
                  }}
                  placeholder="Digite ou edite o roteiro diretamente na tela..."
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    textAlign: settings.textAlign,
                  }}
                  autoFocus
                />
              ) : (
                <div
                  className="prompter-text-body"
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    textAlign: settings.textAlign,
                  }}
                  onDoubleClick={handleToggleInlineEdit}
                  title="Dê duplo clique para editar este texto diretamente (ou pressione E)"
                >
                  {text.split('\n').map((line, lineIdx) => (
                    <div key={lineIdx} className="prompter-text-line">
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              )}

              {/* Espaçamento inferior para o texto poder rolar até a última linha */}
              <div className="prompter-spacer-bottom">
                <div className="prompter-end-marker">
                  <span>— FIM DO ROTEIRO —</span>
                </div>
              </div>
            </div>
          </div>

          {/* HUD de Controles Flutuantes */}
          {!showCountdown && (
            <PrompterControls
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onRestart={handleRestart}
              onBackToEdit={handleBackToEdit}
              isInlineEditing={isInlineEditing}
              onToggleInlineEdit={handleToggleInlineEdit}
              settings={settings}
              onUpdateSetting={updateSetting}
              isWakeLocked={isWakeLocked}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              visible={showControls}
              estimatedSpeechTime={estimatedSpeechTime}
            />
          )}
        </div>
      )}
    </div>
  );
};
