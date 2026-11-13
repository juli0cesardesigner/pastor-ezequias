import { useRef, useCallback, useEffect } from 'react';

interface UsePrompterScrollerProps {
  mode: 'dashboard' | 'editor' | 'reading';
  isPlaying: boolean;
  onTogglePlay?: () => void;
  onPause?: () => void;
  speed: number;
  showCountdown: boolean;
  isInlineEditing: boolean;
  forceLandscape?: boolean;
  rotationAngle?: number;
  fontSize: number;
  maxWidth: number;
  scriptLinesCount?: number;
  onActiveLineChange?: (lineIndex: number) => void;
  onReachEnd?: () => void;
  onTriggerControls?: () => void;
}

export const usePrompterScroller = ({
  mode,
  isPlaying,
  onTogglePlay,
  onPause,
  speed,
  showCountdown,
  isInlineEditing,
  forceLandscape,
  rotationAngle,
  fontSize,
  maxWidth,
  scriptLinesCount,
  onActiveLineChange,
  onReachEnd,
  onTriggerControls,
}: UsePrompterScrollerProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeLineIndexRef = useRef<number>(0);
  const linePositionsRef = useRef<number[]>([]);
  const wheelAccumulatorRef = useRef<number>(0);
  const wheelTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentScrollRef = useRef<number>(0);
  const programmaticScrollUntilRef = useRef<number>(0);
  const momentumAnimRef = useRef<number | null>(null);

  // Velocidade em ref para permitir aceleração/desaceleração imediata sem desmontar o RAF
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Estados de toque para arrasto manual (portrait e landscape)
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startScroll: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    velocity: number;
    isDragging: boolean;
  } | null>(null);

  const justDraggedRef = useRef<boolean>(false);
  const dragClearTimeoutRef = useRef<number | null>(null);

  // Callbacks em refs estáveis para não desmontar o loop de 60fps
  const onActiveLineChangeRef = useRef(onActiveLineChange);
  useEffect(() => {
    onActiveLineChangeRef.current = onActiveLineChange;
  }, [onActiveLineChange]);

  const onReachEndRef = useRef(onReachEnd);
  useEffect(() => {
    onReachEndRef.current = onReachEnd;
  }, [onReachEnd]);

  const onPauseRef = useRef(onPause);
  useEffect(() => {
    onPauseRef.current = onPause;
  }, [onPause]);

  const onTogglePlayRef = useRef(onTogglePlay);
  useEffect(() => {
    onTogglePlayRef.current = onTogglePlay;
  }, [onTogglePlay]);

  const onTriggerControlsRef = useRef(onTriggerControls);
  useEffect(() => {
    onTriggerControlsRef.current = onTriggerControls;
  }, [onTriggerControls]);

  // Cancela animações de momentum ao desmontar
  useEffect(() => {
    return () => {
      if (momentumAnimRef.current) {
        cancelAnimationFrame(momentumAnimRef.current);
        momentumAnimRef.current = null;
      }
    };
  }, []);

  // Calcula todas as posições de scroll para cada linha da roleta usando coordenadas locais no DOM
  // Isso garante total imunidade a rotações CSS (0°, 90°, etc.)
  const computeLinePositions = useCallback((): number[] => {
    if (!scrollerRef.current) return [];
    const scroller = scrollerRef.current;
    if (scroller.clientHeight === 0) return [];

    const lineEls = scroller.querySelectorAll<HTMLElement>('.prompter-text-line');
    if (lineEls.length === 0) return [];

    const isLandscape = forceLandscape || rotationAngle === 90 || rotationAngle === 270;
    const guideRatio = isLandscape ? 0.33 : 0.36;
    const guideOffset = scroller.clientHeight * guideRatio;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

    const positions: number[] = [];
    lineEls.forEach((el) => {
      // Soma os offsetTops de cada pai até o scroller (imune a rotação CSS e zoom)
      let topInScroller = 0;
      let curr: HTMLElement | null = el;
      while (curr && curr !== scroller && curr !== document.body) {
        topInScroller += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      if (curr === document.body && scroller.offsetParent) {
        let scrollerTopInBody = 0;
        let sCurr: HTMLElement | null = scroller;
        while (sCurr && sCurr !== document.body) {
          scrollerTopInBody += sCurr.offsetTop;
          sCurr = sCurr.offsetParent as HTMLElement | null;
        }
        topInScroller -= scrollerTopInBody;
      }

      const lineCenterInContent = topInScroller + el.offsetHeight / 2;
      const targetScroll = Math.max(0, Math.min(maxScroll, lineCenterInContent - guideOffset));
      positions.push(targetScroll);
    });

    return positions;
  }, [forceLandscape, rotationAngle]);

  // Determinar qual linha está ativa com base no scroll atual
  const getActiveLineFromScroll = useCallback((scrollTop: number, positions: number[]): number => {
    if (positions.length === 0) return 0;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < positions.length; i++) {
      const diff = Math.abs(positions[i] - scrollTop);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return closestIdx;
  }, []);

  // Navega e trava a roleta na linha exata
  const scrollToLine = useCallback(
    (targetIndex: number, smooth: boolean = true) => {
      if (!scrollerRef.current) return;
      if (momentumAnimRef.current) {
        cancelAnimationFrame(momentumAnimRef.current);
        momentumAnimRef.current = null;
      }
      const positions =
        linePositionsRef.current.length > 0
          ? linePositionsRef.current
          : computeLinePositions();
      if (positions.length === 0) return;

      const clamped = Math.max(0, Math.min(positions.length - 1, targetIndex));
      const targetScrollTop = positions[clamped];

      activeLineIndexRef.current = clamped;
      onActiveLineChangeRef.current?.(clamped);
      currentScrollRef.current = targetScrollTop;
      lastTimeRef.current = null;

      // Protege contra sobrescrita por eventos onScroll intermediários disparados durante a animação suave
      if (smooth && !isPlaying) {
        programmaticScrollUntilRef.current = performance.now() + 450;
        scrollerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      } else {
        programmaticScrollUntilRef.current = 0;
        scrollerRef.current.scrollTop = targetScrollTop;
      }

      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(8);
        }
      } catch {}
    },
    [computeLinePositions, isPlaying]
  );

  // Reiniciar posição do teleprompter ao topo
  const restart = useCallback(() => {
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
      momentumAnimRef.current = null;
    }
    programmaticScrollUntilRef.current = 0;
    currentScrollRef.current = 0;
    activeLineIndexRef.current = 0;
    lastTimeRef.current = null;
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
    onActiveLineChangeRef.current?.(0);
  }, []);

  // Inicializar posições ao entrar em leitura
  useEffect(() => {
    if (mode === 'reading') {
      const id = requestAnimationFrame(() => {
        const pos = computeLinePositions();
        if (pos.length > 0) {
          linePositionsRef.current = pos;
        }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [mode, computeLinePositions]);

  // Recalcular posições quando fonte, dimensões, texto ou rotação mudarem
  useEffect(() => {
    if (mode !== 'reading') return;
    const id = requestAnimationFrame(() => {
      const pos = computeLinePositions();
      if (pos.length > 0) {
        linePositionsRef.current = pos;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [fontSize, maxWidth, forceLandscape, rotationAngle, scriptLinesCount, computeLinePositions, mode]);

  useEffect(() => {
    if (mode !== 'reading') return;
    const handleResize = () => {
      const pos = computeLinePositions();
      if (pos.length > 0) {
        linePositionsRef.current = pos;
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [mode, computeLinePositions]);

  // Motor de rolagem contínua a 60fps usando requestAnimationFrame
  useEffect(() => {
    if (mode !== 'reading' || !isPlaying || showCountdown || isInlineEditing) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
      if (scrollerRef.current) {
        currentScrollRef.current = scrollerRef.current.scrollTop;
      }
      return;
    }

    if (scrollerRef.current) {
      currentScrollRef.current = scrollerRef.current.scrollTop;
    }
    lastTimeRef.current = null;

    const scrollLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      // Velocidade calculada em pixels por segundo calibrada (1 a 100)
      // speed 1 = ~12px/s, speed 28 = ~112px/s, speed 100 = ~372px/s
      const currentSpeed = speedRef.current;
      const pixelsPerSecond = 12 + (currentSpeed / 100) * 360;
      currentScrollRef.current += pixelsPerSecond * delta;

      if (scrollerRef.current) {
        const scroller = scrollerRef.current;
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

        // Se chegou ao final do conteúdo
        if (maxScroll > 10 && currentScrollRef.current >= maxScroll) {
          currentScrollRef.current = maxScroll;
          scroller.scrollTop = maxScroll;
          onReachEndRef.current?.();
          return;
        }

        scroller.scrollTop = currentScrollRef.current;

        // Atualizar linha ativa para feedback em tempo real na roleta
        const pos = linePositionsRef.current.length > 0 ? linePositionsRef.current : computeLinePositions();
        if (pos.length > 0) {
          const activeIdx = getActiveLineFromScroll(currentScrollRef.current, pos);
          if (activeIdx !== activeLineIndexRef.current) {
            activeLineIndexRef.current = activeIdx;
            onActiveLineChangeRef.current?.(activeIdx);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    animationFrameRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [mode, isPlaying, showCountdown, isInlineEditing, computeLinePositions, getActiveLineFromScroll]);

  // Sincronizar scroll quando o usuário rolar manualmente pelo DOM (ex: mouse wheel externo ou scrollbar)
  // Ignora o evento se a rolagem estiver sendo acionada pelo motor de 60fps ou por touch ativo
  const handleManualScroll = useCallback(() => {
    if (!scrollerRef.current || isInlineEditing) return;
    if (isPlaying || touchStateRef.current?.isDragging) return;

    // Se houver uma animação programática em andamento (ex: scrollToLine por atalho ou controle remoto),
    // ignorar eventos intermediários de scroll para não sobrescrever activeLineIndexRef
    if (performance.now() < programmaticScrollUntilRef.current) {
      return;
    }

    currentScrollRef.current = scrollerRef.current.scrollTop;
    const pos = linePositionsRef.current.length > 0 ? linePositionsRef.current : computeLinePositions();
    if (pos.length > 0) {
      const activeIdx = getActiveLineFromScroll(currentScrollRef.current, pos);
      if (activeIdx !== activeLineIndexRef.current) {
        activeLineIndexRef.current = activeIdx;
        onActiveLineChangeRef.current?.(activeIdx);
      }
    }
  }, [isInlineEditing, isPlaying, computeLinePositions, getActiveLineFromScroll]);

  // Gestos de Touch na Tela: Rolagem 1:1 fluida em modo Retrato (0°) e Paisagem (90°) com inércia e sem snap forçado
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isInlineEditing) return;
      if (momentumAnimRef.current) {
        cancelAnimationFrame(momentumAnimRef.current);
        momentumAnimRef.current = null;
      }
      programmaticScrollUntilRef.current = 0;

      if (e.touches.length === 1 && scrollerRef.current) {
        if (linePositionsRef.current.length === 0) {
          linePositionsRef.current = computeLinePositions();
        }
        const now = performance.now();
        touchStateRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startScroll: scrollerRef.current.scrollTop,
          lastX: e.touches[0].clientX,
          lastY: e.touches[0].clientY,
          lastTime: now,
          velocity: 0,
          isDragging: false,
        };
        if (dragClearTimeoutRef.current) {
          clearTimeout(dragClearTimeoutRef.current);
          dragClearTimeoutRef.current = null;
        }
      }
      onTriggerControlsRef.current?.();
    },
    [isInlineEditing, computeLinePositions]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isInlineEditing || !touchStateRef.current || !scrollerRef.current) return;
      if (e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const totalDx = currentX - touchStateRef.current.startX;
      const totalDy = currentY - touchStateRef.current.startY;

      // Threshold de 6px para diferenciar toque estacionário de intenção de arraste
      if (!touchStateRef.current.isDragging && (Math.abs(totalDx) > 6 || Math.abs(totalDy) > 6)) {
        touchStateRef.current.isDragging = true;
        justDraggedRef.current = true;
        // Se estava em reprodução automática, pausa imediatamente para dar controle manual ao usuário
        if (isPlaying) {
          onPauseRef.current?.();
        }
      }

      if (touchStateRef.current.isDragging) {
        const isLandscape = forceLandscape || rotationAngle === 90 || rotationAngle === 270;
        const isInverted180 = rotationAngle === 180 || rotationAngle === 270;

        // Determinar o deslocamento de scroll ao longo do eixo de leitura:
        // Em 90° clockwise: o texto vertical corre horizontalmente na tela física (arrasto para esquerda avança o texto para baixo)
        // Se o usuário segurar o celular deitado ou em pé, aceita a direção predominante
        let primaryDelta = 0;
        if (isLandscape) {
          // Em 90° clockwise: o topo do texto está à direita da tela física e o rodapé à esquerda.
          // Mover o dedo da esquerda para a direita (+totalDx) puxa o texto para baixo (avança o scroll).
          // Mover o dedo da direita para a esquerda (-totalDx) empurra o texto para cima (recua o scroll).
          // Na vertical física com o aparelho girado: arrastar para baixo (+totalDy) ou para cima (-totalDy)
          primaryDelta = Math.abs(totalDx) >= Math.abs(totalDy) ? totalDx : totalDy;
        } else {
          // Em 0° retrato: arrastar para cima (-totalDy) avança o texto para baixo (+scroll)
          primaryDelta = Math.abs(totalDy) >= Math.abs(totalDx) ? -totalDy : -totalDx;
        }
        if (isInverted180) {
          primaryDelta = -primaryDelta;
        }

        const scroller = scrollerRef.current;
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

        const newScroll = Math.max(0, Math.min(maxScroll, touchStateRef.current.startScroll + primaryDelta));

        const now = performance.now();
        const dt = now - touchStateRef.current.lastTime;
        if (dt > 8) {
          touchStateRef.current.velocity = (newScroll - currentScrollRef.current) / dt;
          touchStateRef.current.lastTime = now;
          touchStateRef.current.lastX = currentX;
          touchStateRef.current.lastY = currentY;
        }

        scroller.scrollTop = newScroll;
        currentScrollRef.current = newScroll;

        const pos = linePositionsRef.current.length > 0 ? linePositionsRef.current : computeLinePositions();
        if (pos.length > 0) {
          const activeIdx = getActiveLineFromScroll(newScroll, pos);
          if (activeIdx !== activeLineIndexRef.current) {
            activeLineIndexRef.current = activeIdx;
            onActiveLineChangeRef.current?.(activeIdx);
          }
        }
      }
    },
    [isInlineEditing, isPlaying, forceLandscape, rotationAngle, computeLinePositions, getActiveLineFromScroll]
  );

  const handleTouchEnd = useCallback(() => {
    if (isInlineEditing) return;
    if (touchStateRef.current?.isDragging) {
      justDraggedRef.current = true;
      if (dragClearTimeoutRef.current) clearTimeout(dragClearTimeoutRef.current);
      dragClearTimeoutRef.current = window.setTimeout(() => {
        justDraggedRef.current = false;
      }, 250);

      const scroller = scrollerRef.current;
      if (scroller) {
        currentScrollRef.current = scroller.scrollTop;

        // Se o usuário fez um flick/swipe rápido, aplicar inércia suave
        const initialVelocity = touchStateRef.current.velocity || 0;
        if (Math.abs(initialVelocity) > 0.25) {
          let currentV = Math.max(-2.5, Math.min(2.5, initialVelocity));
          let lastMomentumTime = performance.now();

          const runMomentum = () => {
            if (!scrollerRef.current || isPlaying) return;
            const now = performance.now();
            const elapsed = Math.min(now - lastMomentumTime, 64);
            lastMomentumTime = now;

            const maxScroll = Math.max(0, scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight);
            const deltaScroll = currentV * elapsed;
            const nextScroll = Math.max(0, Math.min(maxScroll, currentScrollRef.current + deltaScroll));

            scrollerRef.current.scrollTop = nextScroll;
            currentScrollRef.current = nextScroll;

            // Fricção de desaceleração suave (0.94 a cada 16ms)
            currentV *= Math.pow(0.94, elapsed / 16);

            const pos = linePositionsRef.current.length > 0 ? linePositionsRef.current : computeLinePositions();
            if (pos.length > 0) {
              const activeIdx = getActiveLineFromScroll(nextScroll, pos);
              if (activeIdx !== activeLineIndexRef.current) {
                activeLineIndexRef.current = activeIdx;
                onActiveLineChangeRef.current?.(activeIdx);
              }
            }

            if (Math.abs(currentV) > 0.05 && nextScroll > 0 && nextScroll < maxScroll) {
              momentumAnimRef.current = requestAnimationFrame(runMomentum);
            } else {
              momentumAnimRef.current = null;
            }
          };

          momentumAnimRef.current = requestAnimationFrame(runMomentum);
        } else {
          // Permanece exatamente onde o dedo soltou (sem salto forçado!)
          const pos = linePositionsRef.current.length > 0 ? linePositionsRef.current : computeLinePositions();
          if (pos.length > 0) {
            const activeIdx = getActiveLineFromScroll(scroller.scrollTop, pos);
            if (activeIdx !== activeLineIndexRef.current) {
              activeLineIndexRef.current = activeIdx;
              onActiveLineChangeRef.current?.(activeIdx);
            }
          }
        }
      }
    }
    touchStateRef.current = null;
  }, [isInlineEditing, isPlaying, computeLinePositions, getActiveLineFromScroll]);

  // Click na tela de leitura com proteção contra arraste touch
  const handleScreenClick = useCallback(() => {
    if (showCountdown || isInlineEditing) return;
    // Se acabou de soltar um arraste com o dedo, NÃO alternar play/pause!
    if (justDraggedRef.current || touchStateRef.current?.isDragging) return;
    onTogglePlayRef.current?.();
  }, [showCountdown, isInlineEditing]);

  // Navegação via Roda do Mouse
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (mode !== 'reading' || isInlineEditing) return;
      if (e.cancelable) e.preventDefault();
      programmaticScrollUntilRef.current = 0;

      wheelAccumulatorRef.current += e.deltaY;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      const threshold = 35;
      if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        const target = activeLineIndexRef.current + direction;
        scrollToLine(target, true);
        wheelAccumulatorRef.current = 0;
      }

      wheelTimeoutRef.current = window.setTimeout(() => {
        wheelAccumulatorRef.current = 0;
      }, 120);
    },
    [mode, isInlineEditing, scrollToLine]
  );

  return {
    scrollerRef,
    activeLineIndexRef,
    linePositionsRef,
    currentScrollRef,
    scrollToLine,
    computeLinePositions,
    handleManualScroll,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleScreenClick,
    restart,
  };
};
