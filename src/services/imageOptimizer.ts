/**
 * Utilitário de Otimização e Compressão de Imagens Client-Side
 * Redimensiona e comprime imagens para Data URLs ultra leves (WebP/JPEG)
 * Mantém tamanho de 20-50KB para gravação ágil no banco e renderização instantânea
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressAndOptimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;

        // Calcula proporção sem distorcer
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Desenha imagem redimensionada
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para WebP (fallback para JPEG caso navegador antigo não suporte WebP)
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Ignora e tenta JPEG
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };

      img.onerror = () => {
        reject(new Error('Não foi possível carregar a imagem. Tente outro arquivo.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo do dispositivo.'));
    };

    reader.readAsDataURL(file);
  });
}
