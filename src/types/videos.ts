export type MediaFolder = 'videos' | 'imagens' | 'musica' | 'figurinhas';

export interface CampaignVideo {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  rawWixUrl?: string;
  folder: MediaFolder;
  isActive: boolean;
  displayOrder: number;
  downloadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedWixUrl {
  videoUrl: string;
  posterUrl?: string;
  videoId?: string;
  suggestedFileName: string;
  detectedFolder?: MediaFolder;
}
