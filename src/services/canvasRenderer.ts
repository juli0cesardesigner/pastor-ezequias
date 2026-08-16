import type { RenderOptions } from '../types/editor';

// =========================================================================
// ⚙️ CONFIGURAÇÕES DE DESFOQUE, BRILHO E CONTRASTE DO FUNDO
// =========================================================================
export const BACKGROUND_BLUR_CONFIG = {
  // Quantidade de desfoque em pixels (prévia / download HD)
  blurPreviewPx: 10,
  blurExportPx: 10,

  // Brilho (1.0 = original, 0.75 = 25% mais escuro para dar destaque à foto)
  brightness: 1.0,

  // Contraste (1.0 = original, 1.1 = 10% mais contraste, 0.9 = mais suave)
  contrast: 1.2,

  // Saturação das cores (1.0 = original, 1.2 = cores mais vivas)
  saturate: 1.0,
};

/**
 * Draws the user's photo transformed (zoom, pan, rotation, flip) and overlays the frame
 */
export function renderCanvas({
  canvas,
  userImage,
  frameImage,
  transform,
  showCircularGuide = false,
  highResolution = false,
}: RenderOptions): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Enable crisp image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = highResolution ? 'high' : 'medium';

  // 1. Clear canvas & set dark background matching brand
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw user photo layers if available
  if (userImage) {
    // 2a. Background Layer: Duplicated blurred photo covering 100% of canvas (prevents any blank/white borders)
    ctx.save();
    const blurPx = highResolution
      ? BACKGROUND_BLUR_CONFIG.blurExportPx
      : BACKGROUND_BLUR_CONFIG.blurPreviewPx;

    const { brightness, contrast, saturate } = BACKGROUND_BLUR_CONFIG;
    ctx.filter = `blur(${blurPx}px) brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

    // Scale slightly larger than canvas to avoid edge blur fade
    const bgScale = Math.max(width / userImage.width, height / userImage.height) * 1.25;
    const bgWidth = userImage.width * bgScale;
    const bgHeight = userImage.height * bgScale;
    const bgX = (width - bgWidth) / 2;
    const bgY = (height - bgHeight) / 2;

    ctx.drawImage(userImage, bgX, bgY, bgWidth, bgHeight);
    ctx.restore();

    // 2b. Foreground Layer: Main sharp transformed user image
    ctx.save();
    ctx.filter = 'none';

    // Center coordinate origin in canvas center
    ctx.translate(width / 2, height / 2);

    // Apply rotation
    if (transform.rotation !== 0) {
      ctx.rotate((transform.rotation * Math.PI) / 180);
    }

    // Apply flip horizontal
    if (transform.flipHorizontal) {
      ctx.scale(-1, 1);
    }

    // Compute base scale to cover the canvas (cover fit)
    const baseScale = Math.max(width / userImage.width, height / userImage.height);
    const finalScale = baseScale * transform.scale;

    const drawWidth = userImage.width * finalScale;
    const drawHeight = userImage.height * finalScale;

    // Apply user panning offsets
    const drawX = -drawWidth / 2 + transform.offsetX;
    const drawY = -drawHeight / 2 + transform.offsetY;

    ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  }

  // 3. Draw frame overlay on top
  if (frameImage) {
    ctx.save();
    ctx.filter = 'none';
    ctx.drawImage(frameImage, 0, 0, width, height);
    ctx.restore();
  }

  // 4. Draw optional circular guide overlay for interactive preview
  if (showCircularGuide) {
    drawCircularMaskGuide(ctx, width, height);
  }
}

/**
 * Visual guide showing the circular cut applied by WhatsApp / Instagram profile photos
 */
function drawCircularMaskGuide(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  const radius = Math.min(width, height) / 2 - 2;

  // Darken corners outside the circle to give immediate preview of the avatar crop
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
  ctx.fill();

  // Draw subtle guide ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, false);
  ctx.stroke();

  ctx.restore();
}
