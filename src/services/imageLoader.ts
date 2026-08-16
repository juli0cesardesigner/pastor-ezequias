/**
 * Service to handle loading images from files and URLs safely
 */
export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Erro ao decodificar a imagem.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de foto.'));
    reader.readAsDataURL(file);
  });
}

export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Erro ao carregar imagem: ${url}`));
    img.src = url;
  });
}
