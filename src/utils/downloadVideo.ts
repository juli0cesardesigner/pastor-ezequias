import type { MediaFolder } from '../types/videos';

/**
 * Função utilitária para download direto de arquivos de mídia (vídeo, áudio, imagens ou figurinhas).
 * Tenta fazer o download via Blob para garantir que o navegador salve o arquivo
 * no disco/rolo da câmera com o nome e extensão corretos em vez de apenas abrir no player.
 */
export async function downloadVideoFile(
  videoUrl: string,
  title: string,
  onProgress?: (isDownloading: boolean) => void,
  folder?: MediaFolder
): Promise<boolean> {
  if (!videoUrl) return false;
  onProgress?.(true);

  // Gera nome base amigável e limpo
  const cleanTitle = (title || 'material-campanha')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();

  // Determina a extensão do arquivo com base na URL ou folder
  const cleanUrl = (videoUrl || '').split('?')[0].toLowerCase();
  let ext = '.mp4';

  if (cleanUrl.endsWith('.mp3') || cleanUrl.includes('/mp3/') || folder === 'musica') {
    ext = '.mp3';
  } else if (cleanUrl.endsWith('.wav')) {
    ext = '.wav';
  } else if (cleanUrl.endsWith('.png')) {
    ext = '.png';
  } else if (cleanUrl.endsWith('.webp')) {
    ext = '.webp';
  } else if (folder === 'figurinhas') {
    ext = cleanUrl.endsWith('.png') ? '.png' : '.webp';
  } else if (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.includes('~mv2.jpg') ||
    folder === 'imagens'
  ) {
    ext = '.jpg';
  } else if (cleanUrl.endsWith('.mp4') || folder === 'videos') {
    ext = '.mp4';
  }

  const finalFileName = `${cleanTitle}${ext}`;

  try {
    // 1. Tenta download via fetch + blob (suportado pelo CDN do Wix devido ao CORS *)
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);

    return true;
  } catch (err) {
    console.warn('Falha no download via blob, tentando fallback direto:', err);

    // 2. Fallback tradicional caso o fetch seja bloqueado por política de rede
    const fallbackLink = document.createElement('a');
    fallbackLink.href = videoUrl;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.download = finalFileName;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);

    return false;
  } finally {
    onProgress?.(false);
  }
}
