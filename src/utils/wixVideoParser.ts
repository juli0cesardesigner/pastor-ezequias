import type { ParsedWixUrl } from '../types/videos';

/**
 * Normaliza e analisa URLs de vídeo, áudio, imagens ou figurinhas do Wix ou links diretos.
 * Suporta:
 * - Áudios Wix: https://static.wixstatic.com/mp3/... ou wix:audio://...
 * - Imagens Wix: https://static.wixstatic.com/media/... ou wix:image://...
 * - Vídeos Wix: https://video.wixstatic.com/video/... ou wix:video://...
 * - Links diretos HTTP/HTTPS genéricos.
 */
export function parseWixVideoUrl(input: string): ParsedWixUrl {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return {
      videoUrl: '',
      suggestedFileName: 'midia',
      detectedFolder: 'videos'
    };
  }

  // 1. Áudios do Wix (ex: https://static.wixstatic.com/mp3/573bd6_0589b064b4cc401b853f4d02f65b6fcb.mp3)
  if (
    trimmed.includes('static.wixstatic.com/mp3/') ||
    trimmed.startsWith('wix:audio://') ||
    trimmed.startsWith('wix:mp3://') ||
    /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(trimmed)
  ) {
    let cleanUrl = trimmed;
    if (trimmed.startsWith('wix:audio://') || trimmed.startsWith('wix:mp3://')) {
      const match = trimmed.match(/wix:(?:audio|mp3):\/\/v1\/([^/#]+)/);
      const audioFile = match ? match[1] : '';
      cleanUrl = audioFile ? `https://static.wixstatic.com/mp3/${audioFile}` : trimmed;
    }
    const fileName = cleanUrl.split('?')[0].split('/').pop() || 'audio.mp3';
    return {
      videoUrl: cleanUrl,
      suggestedFileName: fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`,
      detectedFolder: 'musica'
    };
  }

  // 2. Imagens do Wix (ex: https://static.wixstatic.com/media/573bd6_3f276d58c67a4e2e916d741c9157e8de~mv2.jpg)
  if (
    trimmed.startsWith('wix:image://') ||
    trimmed.includes('static.wixstatic.com/media/') ||
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(trimmed)
  ) {
    let cleanUrl = trimmed;
    if (trimmed.startsWith('wix:image://')) {
      const fileMatch = trimmed.match(/wix:image:\/\/v1\/([^/#]+)/);
      const imageFile = fileMatch ? fileMatch[1] : '';
      cleanUrl = imageFile ? `https://static.wixstatic.com/media/${imageFile}` : trimmed;
    }
    const fileName = cleanUrl.split('?')[0].split('/').pop() || 'imagem.jpg';
    return {
      videoUrl: cleanUrl,
      posterUrl: cleanUrl,
      suggestedFileName: fileName,
      detectedFolder: 'imagens'
    };
  }

  // 3. Vídeos do Wix: wix:video://v1/<videoId>/<fileName>#posterUri=<posterFile>...
  if (trimmed.startsWith('wix:video://')) {
    const idMatch = trimmed.match(/wix:video:\/\/v1\/([^/]+)/);
    const videoId = idMatch ? idMatch[1] : '';

    const posterMatch = trimmed.match(/posterUri=([^&#]+)/);
    const posterFile = posterMatch ? posterMatch[1] : '';

    const nameMatch = trimmed.match(/wix:video:\/\/v1\/[^/]+\/([^#]+)/);
    let rawFileName = nameMatch ? nameMatch[1] : 'video.mp4';
    try {
      rawFileName = decodeURIComponent(rawFileName);
    } catch {
      // Ignora falha de decodificação
    }

    const videoUrl = videoId
      ? `https://video.wixstatic.com/video/${videoId}/1080p/mp4/file.mp4`
      : trimmed;

    const posterUrl = posterFile
      ? `https://static.wixstatic.com/media/${posterFile}`
      : undefined;

    return {
      videoUrl,
      posterUrl,
      videoId,
      suggestedFileName: rawFileName.endsWith('.mp4') ? rawFileName : `${rawFileName}.mp4`,
      detectedFolder: 'videos'
    };
  }

  // 4. Formato Direto de Vídeo Wix: https://video.wixstatic.com/video/<videoId>/...
  if (trimmed.includes('video.wixstatic.com/video/') || /\.(mp4|mov|webm)(\?.*)?$/i.test(trimmed)) {
    const idMatch = trimmed.match(/\/video\/([^/]+)/);
    const videoId = idMatch ? idMatch[1] : '';

    return {
      videoUrl: trimmed,
      videoId,
      suggestedFileName: 'video.mp4',
      detectedFolder: 'videos'
    };
  }

  // Formato genérico (link direto HTTP/HTTPS)
  const cleanName = trimmed.split('?')[0].split('/').pop() || 'midia';

  return {
    videoUrl: trimmed,
    suggestedFileName: cleanName
  };
}
