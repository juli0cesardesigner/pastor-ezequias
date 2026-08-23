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
      async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        // Check if Web Share API with files is available (iOS / Android)
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Foto de Perfil - Pastor Ezequias',
              text: 'Minha foto oficial de apoio ao Pastor Ezequias!',
            });
            triggerCelebrationConfetti();
            resolve(blob);
            return;
          } catch (err: any) {
            // If user closed/cancelled the share sheet, treat it gracefully
            if (err.name === 'AbortError') {
              resolve(blob);
              return;
            }
            console.warn('Web Share falhou, caindo para download padrão:', err);
          }
        }

        // Fallback: Trigger standard browser download (Desktop / Unsupported browsers)
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
