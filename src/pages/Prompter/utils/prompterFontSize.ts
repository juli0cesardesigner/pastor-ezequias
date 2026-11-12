/**
 * Utilitário para cálculo de tamanho ideal de fonte que impede hifenização / quebra forçada de palavras.
 * Mede a maior palavra individual do roteiro contra a largura disponível do contêiner.
 */

export function calculateMaxSafeFontSize(
  text: string,
  containerWidth: number,
  paddingHorizontal: number = 48
): number {
  if (!text || !text.trim() || typeof window === 'undefined') {
    return 64;
  }

  const usableWidth = Math.max(200, containerWidth - paddingHorizontal);

  // Divide o texto em palavras individuais para achar a palavra mais longa
  const words = text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) return 64;

  let longestWord = '';
  for (const w of words) {
    if (w.length > longestWord.length) {
      longestWord = w;
    }
  }

  // Cria canvas offscreen temporário para medição precisa de fonte
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 56;

    // Mede com tamanho base de 100px para escala linear direta
    ctx.font = '800 100px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const measuredWidth = ctx.measureText(longestWord).width;

    if (measuredWidth <= 0) return 56;

    // Tamanho exato onde a maior palavra atinge 94% da largura utilizável (margem de segurança)
    const exactFontSize = Math.floor((usableWidth * 0.94 / measuredWidth) * 100);

    // Limites de segurança razoáveis: mínimo 22px, máximo 96px
    return Math.max(22, Math.min(96, exactFontSize));
  } catch {
    return 52;
  }
}

