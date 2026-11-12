import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  fetchCloudScripts,
  saveCloudScript,
  deleteCloudScript,
  type CloudScript,
} from '../../../services/prompterService';

export const usePrompterCloud = () => {
  const [cloudScripts, setCloudScripts] = useState<CloudScript[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [activeCloudScript, setActiveCloudScript] = useState<CloudScript | null>(null);

  // Busca por texto
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Carregar lista de roteiros do Neon DB
  const loadCloudScripts = useCallback(async () => {
    setIsLoadingCloud(true);
    setCloudError(null);
    try {
      const data = await fetchCloudScripts();
      setCloudScripts(data);
    } catch (err) {
      console.error('Erro ao conectar ao Neon DB:', err);
      setCloudError('Não foi possível sincronizar com o banco.');
    } finally {
      setIsLoadingCloud(false);
    }
  }, []);

  useEffect(() => {
    loadCloudScripts();
  }, [loadCloudScripts]);

  // Lista filtrada em memória apenas por busca textual
  const filteredCloudScripts = useMemo(() => {
    return cloudScripts.filter((script) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        script.title.toLowerCase().includes(q) ||
        script.content.toLowerCase().includes(q)
      );
    });
  }, [cloudScripts, searchQuery]);

  // Salvar novo ou atualizar script existente
  const saveScript = useCallback(
    async (params: {
      id?: number | null;
      title: string;
      content: string;
      category?: string;
    }): Promise<CloudScript> => {
      const saved = await saveCloudScript(params);
      setActiveCloudScript(saved);
      setCloudScripts((prev) => {
        const idx = prev.findIndex((s) => s.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      return saved;
    },
    []
  );

  // Excluir script
  const removeScript = useCallback(
    async (id: number): Promise<boolean> => {
      const success = await deleteCloudScript(id);
      if (success) {
        setCloudScripts((prev) => prev.filter((s) => s.id !== id));
        if (activeCloudScript?.id === id) {
          setActiveCloudScript(null);
        }
      }
      return success;
    },
    [activeCloudScript]
  );

  return {
    cloudScripts,
    filteredCloudScripts,
    isLoadingCloud,
    cloudError,
    activeCloudScript,
    setActiveCloudScript,
    loadCloudScripts,
    saveScript,
    removeScript,
    searchQuery,
    setSearchQuery,
  };
};
