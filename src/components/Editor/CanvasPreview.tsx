import React, { useRef, useEffect } from 'react';
import type { TransformState } from '../../types/editor';
import { renderCanvas } from '../../services/canvasRenderer';
import { useCanvasGestures } from '../../hooks/useCanvasGestures';
import './CanvasPreview.css';

interface CanvasPreviewProps {
  userImage: HTMLImageElement | null;
  frameImage: HTMLImageElement | null;
  transform: TransformState;
  onPan: (dx: number, dy: number) => void;
  onZoomChange?: (delta: number) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  userImage,
  frameImage,
  transform,
  onPan,
  onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Bind pointer & gesture events
  const gestures = useCanvasGestures({
    onPan,
    onZoomChange,
    isEnabled: !!userImage,
  });

  // Re-render whenever transform, frame, userImage or circular guide changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderCanvas({
      canvas,
      userImage,
      frameImage,
      transform,
      showCircularGuide: false,
      highResolution: false,
    });
  }, [userImage, frameImage, transform]);

  return (
    <div className="preview-wrapper">
      <div className="canvas-container" {...gestures}>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="main-canvas"
        />
      </div>
    </div>
  );
};
