import type { TransformState } from '../types/editor';
import { EXPORT_SIZE } from '../config/campaign';
import { renderCanvas } from './canvasRenderer';
import confetti from 'canvas-confetti';

/**
 * Generates an HD 1080x1080 offscreen canvas with full resolution image and downloads it
 */
export async function exportCompositeImage(
  userImage: HTMLImageElement | null,
  frameImage: HTMLImageElement | null,
  transform: TransformState,
  filename = 'foto-perfil-pastor-ezequias.png'
): Promise<Blob | null> {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = EXPORT_SIZE;
  offscreenCanvas.height = EXPORT_SIZE;

  // Scale panning offsets proportionately to the export resolution (canvas width is 600px)
  const scaleFactor = EXPORT_SIZE / 600;
  const scaledTransform: TransformState = {
    ...transform,
    offsetX: transform.offsetX * scaleFactor,
    offsetY: transform.offsetY * scaleFactor,
  };

  renderCanvas({
    canvas: offscreenCanvas,
    userImage,
    frameImage,
    transform: scaledTransform,
    showCircularGuide: false,
    highResolution: true,
  });

  return new Promise((resolve) => {
    offscreenCanvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        // Trigger native download
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

        // Trigger celebratory confetti effect
        triggerCelebrationConfetti();
        resolve(blob);
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Confetti animation to delight the supporter upon downloading
 */
export function triggerCelebrationConfetti(): void {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#154BB2', '#F59E0B', '#10B981', '#FDE047'],
    });
  } catch {
    // Graceful fallback if confetti fails
  }
}
