import { useState, useEffect, useCallback } from 'react';
import { fetchMaterialsCatalog, saveCatalogItem, deleteCatalogItem } from '../services/materialCatalogService';
import {
  fetchMaterialRequests,
  updateMaterialRequestStatus,
  getCampaignSetting,
  saveCampaignSetting
} from '../services/materialRequestService';
import type {
  MaterialCatalogItem,
  MaterialRequestRecord,
  MaterialRequestStatus
} from '../types/materials';

export function useAdminMaterials() {
  const [requests, setRequests] = useState<MaterialRequestRecord[]>([]);
  const [catalog, setCatalog] = useState<MaterialCatalogItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingSetting, setIsSavingSetting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqList, catList, phone] = await Promise.all([
        fetchMaterialRequests(statusFilter),
        fetchMaterialsCatalog(false),
        getCampaignSetting('whatsapp_destination', '5527999999999')
      ]);
      setRequests(reqList);
      setCatalog(catList);
      setWhatsappNumber(phone);
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = useCallback(async (id: number, newStatus: MaterialRequestStatus) => {
    const success = await updateMaterialRequestStatus(id, newStatus);
    if (success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      setFeedbackMsg({ text: `Status do pedido #${id} atualizado com sucesso!`, type: 'success' });
    } else {
      setFeedbackMsg({ text: 'Falha ao atualizar status do pedido.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  }, []);

  const handleSaveCatalogItem = useCallback(async (item: MaterialCatalogItem) => {
    const success = await saveCatalogItem(item);
    if (success) {
      setFeedbackMsg({ text: `Material "${item.name}" salvo com sucesso!`, type: 'success' });
      await loadData();
    } else {
      setFeedbackMsg({ text: 'Erro ao salvar material no banco.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
    return success;
  }, [loadData]);

  const handleDeleteCatalogItem = useCallback(async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este material do catálogo?')) return;
    const success = await deleteCatalogItem(id);
    if (success) {
      setFeedbackMsg({ text: 'Material removido do catálogo.', type: 'success' });
      await loadData();
    } else {
      setFeedbackMsg({ text: 'Erro ao remover material.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  }, [loadData]);

  const handleSaveWhatsapp = useCallback(async (phone: string) => {
    setIsSavingSetting(true);
    const success = await saveCampaignSetting('whatsapp_destination', phone);
    setIsSavingSetting(false);
    if (success) {
      setWhatsappNumber(phone);
      setFeedbackMsg({ text: 'WhatsApp de destino atualizado com sucesso!', type: 'success' });
    } else {
      setFeedbackMsg({ text: 'Erro ao atualizar WhatsApp.', type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  }, []);

  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.supporter_name.toLowerCase().includes(term) ||
      r.whatsapp.includes(term) ||
      r.city.toLowerCase().includes(term) ||
      String(r.id).includes(term)
    );
  });

  const exportToCSV = useCallback(() => {
    if (requests.length === 0) return;
    const headers = ['ID', 'Data', 'Status', 'Apoiador', 'WhatsApp', 'CEP', 'Rua', 'Numero', 'Complemento', 'Bairro', 'Cidade', 'UF', 'Materiais', 'Observacoes'];
    const rows = requests.map((r) => [
      r.id,
      new Date(r.created_at).toLocaleString('pt-BR'),
      r.status,
      `"${r.supporter_name.replace(/"/g, '""')}"`,
      r.whatsapp,
      r.cep,
      `"${r.street.replace(/"/g, '""')}"`,
      r.number,
      `"${(r.complement || '').replace(/"/g, '""')}"`,
      `"${r.neighborhood.replace(/"/g, '""')}"`,
      `"${r.city.replace(/"/g, '""')}"`,
      r.state,
      `"${r.items_json.map((i) => `${i.quantity}x ${i.name}`).join('; ')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_materiais_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [requests]);

  return {
    requests: filteredRequests,
    rawRequests: requests,
    catalog,
    statusFilter,
    searchTerm,
    whatsappNumber,
    isLoading,
    isSavingSetting,
    feedbackMsg,
    setStatusFilter,
    setSearchTerm,
    handleStatusChange,
    handleSaveCatalogItem,
    handleDeleteCatalogItem,
    handleSaveWhatsapp,
    loadData,
    exportToCSV
  };
}
