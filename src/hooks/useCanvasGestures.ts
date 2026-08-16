import { useRef, useCallback } from 'react';
import type { DragPosition } from '../types/editor';

interface UseCanvasGesturesProps {
  onPan: (dx: number, dy: number) => void;
  onZoomChange?: (delta: number) => void;
  isEnabled: boolean;
}

export function useCanvasGestures({
  onPan,
  onZoomChange,
  isEnabled,
}: UseCanvasGesturesProps) {
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<DragPosition>({ x: 0, y: 0 });

  // Pointer Down
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isEnabled) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    },
    [isEnabled]
  );

  // Pointer Move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !isEnabled) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      onPan(dx, dy);
    },
    [isEnabled, onPan]
  );

  // Pointer Up
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch if pointer was released
      }
    },
    []
  );

  // Wheel Zoom support on desktop
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!isEnabled || !onZoomChange) return;
      e.preventDefault();
      const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
      onZoomChange(zoomStep);
    },
    [isEnabled, onZoomChange]
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onWheel: handleWheel,
  };
}
