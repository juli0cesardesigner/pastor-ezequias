import { useRef, useCallback, useEffect } from 'react';

interface UsePrompterScrollerProps {
  mode: 'dashboard' | 'editor' | 'reading';
  isPlaying: boolean;
  speed: number;
  showCountdown: boolean;
  isInlineEditing: boolean;
  forceLandscape?: boolean;
  fontSize: number;
  maxWidth: number;
  onActiveLineChange?: (lineIndex: number) => void;
  onReachEnd?: () => void;
}

export const usePrompterScroller = ({
  mode,
  isPlaying,
  speed,
  showCountdown,
  isInlineEditing,
  forceLandscape,
  fontSize,
  maxWidth,
  onActiveLineChange,
  onReachEnd,
}: UsePrompterScrollerProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeLineIndexRef = useRef<number>(0);
  const linePositionsRef = useRef<number[]>([]);
  const wheelAccumulatorRef = useRef<number>(0);
  const wheelTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentScrollRef = useRef<number>(0);

  // Calcula todas as posições de scroll para cada linha da roleta usando o DOM real
  const computeLinePositions = useCallback((): number[] => {
    if (!scrollerRef.current) return [];
    const scroller = scrollerRef.current;
    const lineEls = scroller.querySelectorAll<HTMLElement>('.prompter-text-line');
    if (lineEls.length === 0) return [];

    const scrollerRect = scroller.getBoundingClientRect();
    const currentScroll = scroller.scrollTop;
    const guideRatio = forceLandscape ? 0.33 : 0.36;
    const guideOffset = scroller.clientHeight * guideRatio;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

    const positions: number[] = [];
    lineEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const lineCenterInContent = rect.top - scrollerRect.top + currentScroll + rect.height / 2;
      const targetScroll = Math.max(0, Math.min(maxScroll, lineCenterInContent - guideOffset));
      positions.push(targetScroll);
    });

    return positions;
  }, [forceLandscape]);

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
      const positions =
        linePositionsRef.current.length > 0
          ? linePositionsRef.current
          : computeLinePositions();
      if (positions.length === 0) return;

      const clamped = Math.max(0, Math.min(positions.length - 1, targetIndex));
      const targetScrollTop = positions[clamped];

      activeLineIndexRef.current = clamped;
      onActiveLineChange?.(clamped);
      currentScrollRef.current = targetScrollTop;
      lastTimeRef.current = null;

      if (smooth && !isPlaying) {
        scrollerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      } else {
        scrollerRef.current.scrollTop = targetScrollTop;
      }

      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(8);
        }
      } catch {}
    },
    [computeLinePositions, isPlaying, onActiveLineChange]
  );

  // Inicializar posições ao entrar em leitura
  useEffect(() => {
    if (mode === 'reading') {
      const id = requestAnimationFrame(() => {
        const pos = computeLinePositions();
        linePositionsRef.current = pos;
      });
      return () => cancelAnimationFrame(id);
    }
  }, [mode, computeLinePositions]);

  // Recalcular posições quando fonte, dimensões ou rotação mudarem
  useEffect(() => {
    if (mode !== 'reading') return;
    const id = requestAnimationFrame(() => {
      const pos = computeLinePositions();
      linePositionsRef.current = pos;
      scrollToLine(activeLineIndexRef.current, false);
    });
    return () => cancelAnimationFrame(id);
  }, [fontSize, maxWidth, forceLandscape, computeLinePositions, scrollToLine, mode]);

  useEffect(() => {
    if (mode !== 'reading') return;
    const handleResize = () => {
      const pos = computeLinePositions();
      linePositionsRef.current = pos;
      scrollToLine(activeLineIndexRef.current, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode, computeLinePositions, scrollToLine]);

  // Motor de rolagem contínua a 60fps usando requestAnimationFrame
  useEffect(() => {
    if (mode !== 'reading' || !isPlaying || showCountdown || isInlineEditing) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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

      // Velocidade calculada em pixels por segundo calibrada (1 a 100)
      // speed 1 = ~12px/s, speed 28 = ~112px/s, speed 100 = ~372px/s
      const pixelsPerSecond = 12 + (speed / 100) * 360;
      currentScrollRef.current += pixelsPerSecond * delta;

      if (scrollerRef.current) {
        scrollerRef.current.scrollTop = currentScrollRef.current;

        // Atualizar linha ativa para feedback em tempo real na roleta
        const pos = linePositionsRef.current;
        if (pos.length > 0) {
          const activeIdx = getActiveLineFromScroll(currentScrollRef.current, pos);
          if (activeIdx !== activeLineIndexRef.current) {
            activeLineIndexRef.current = activeIdx;
            onActiveLineChange?.(activeIdx);
          }
        }

        // Se chegou ao final do conteúdo
        const maxScroll = scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight;
        if (currentScrollRef.current >= maxScroll && maxScroll > 0) {
          onReachEnd?.();
          return;
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
  }, [mode, isPlaying, speed, showCountdown, isInlineEditing, getActiveLineFromScroll, onActiveLineChange, onReachEnd]);

  // Sincronizar scroll quando o usuário rolar manualmente com o dedo/mouse
  const handleManualScroll = useCallback(() => {
    if (!scrollerRef.current || isInlineEditing) return;
    currentScrollRef.current = scrollerRef.current.scrollTop;
    if (linePositionsRef.current.length > 0) {
      const activeIdx = getActiveLineFromScroll(currentScrollRef.current, linePositionsRef.current);
      if (activeIdx !== activeLineIndexRef.current) {
        activeLineIndexRef.current = activeIdx;
        onActiveLineChange?.(activeIdx);
      }
    }
  }, [isInlineEditing, getActiveLineFromScroll, onActiveLineChange]);

  // Touch e Roleta via Roda do Mouse
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (mode !== 'reading' || isInlineEditing) return;
      e.preventDefault();

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
  };
};
