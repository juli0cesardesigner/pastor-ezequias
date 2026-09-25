import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchCampaignVideos,
  saveCampaignVideo,
  deleteCampaignVideo,
  incrementVideoDownloadCount
} from '../services/videoService';
import { downloadVideoFile } from '../utils/downloadVideo';
import type { CampaignVideo, MediaFolder } from '../types/videos';

export function useCampaignVideos(onlyActive = true, initialFolder?: MediaFolder) {
  const [videos, setVideos] = useState<CampaignVideo[]>([]);
  const [activeFolder, setActiveFolder] = useState<MediaFolder | 'all'>(initialFolder || 'all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCampaignVideos(onlyActive);
      setVideos(data);
    } catch (err: unknown) {
      console.error('Erro ao carregar mídias:', err);
      setError('Não foi possível carregar as mídias no momento.');
    } finally {
      setIsLoading(false);
    }
  }, [onlyActive]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Contadores por pasta
  const folderCounts = useMemo(() => {
    const counts: Record<MediaFolder, number> = {
      videos: 0,
      imagens: 0,
      musica: 0,
      figurinhas: 0
    };

    for (const v of videos) {
      const folderKey = (v.folder || 'videos') as MediaFolder;
      if (counts[folderKey] !== undefined) {
        counts[folderKey]++;
      }
    }
    return counts;
  }, [videos]);

  // Itens filtrados pela pasta ativa
  const filteredVideos = useMemo(() => {
    if (activeFolder === 'all') return videos;
    return videos.filter((v) => (v.folder || 'videos') === activeFolder);
  }, [videos, activeFolder]);

  const handleDownload = async (video: CampaignVideo) => {
    setDownloadingId(video.id);
    try {
      const success = await downloadVideoFile(
        video.videoUrl,
        video.title,
        (isDownloading) => {
          if (!isDownloading) setDownloadingId(null);
        },
        video.folder
      );

      if (success) {
        // Incrementa contador silenciosamente em background
        incrementVideoDownloadCount(video.id);
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, downloadCount: (v.downloadCount || 0) + 1 } : v
          )
        );
      }
    } catch (err) {
      console.error('Erro ao baixar mídia:', err);
      setDownloadingId(null);
    }
  };

  const handleSave = async (
    video: Partial<CampaignVideo> & { id: string; title: string; videoUrl: string }
  ) => {
    const success = await saveCampaignVideo(video);
    if (success) {
      await loadVideos();
    }
    return success;
  };

  const handleDelete = async (id: string) => {
    const success = await deleteCampaignVideo(id);
    if (success) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
    }
    return success;
  };

  const handleToggleActive = async (video: CampaignVideo) => {
    const updated = { ...video, isActive: !video.isActive };
    const success = await saveCampaignVideo(updated);
    if (success) {
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, isActive: !v.isActive } : v))
      );
    }
    return success;
  };

  return {
    videos,
    filteredVideos,
    activeFolder,
    setActiveFolder,
    folderCounts,
    isLoading,
    error,
    downloadingId,
    loadVideos,
    handleDownload,
    handleSave,
    handleDelete,
    handleToggleActive
  };
}
