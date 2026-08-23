import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, BarChart3, ShoppingBag, Settings, AlertCircle, Layers } from 'lucide-react';
import { fetchAdminMetrics } from '../../services/adminService';
import { useAdminMaterials } from '../../hooks/useAdminMaterials';
import { AdminMetricsTab } from './components/AdminMetricsTab';
import { AdminMaterialsRequestsTab } from './components/AdminMaterialsRequestsTab';
import { AdminCatalogSettingsTab } from './components/AdminCatalogSettingsTab';
import type { CampaignMetrics, ActivityLogItem } from '../../types/analytics';
import './AdminPage.css';

type AdminTab = 'metrics' | 'materials' | 'catalog';

interface AdminPageProps {
  onBackToSite: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToSite }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('materials');
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    totalVisits: 0, totalDownloads: 0, conversionRate: 0, lastUpdated: ''
  });
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

  const {
    requests,
    catalog,
    statusFilter,
    searchTerm,
    whatsappNumber,
    isLoading: isLoadingMaterials,
    isSavingSetting,
    feedbackMsg,
    setStatusFilter,
    setSearchTerm,
    handleStatusChange,
    handleSaveCatalogItem,
    handleDeleteCatalogItem,
    handleSeedDefaults,
    handleSaveWhatsapp,
    loadData: refreshMaterialsData,
    exportToCSV
  } = useAdminMaterials();

  const isGlobalLoading = isLoadingMetrics || isLoadingMaterials;

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await fetchAdminMetrics();
      setMetrics(data.metrics);
      setLogs(data.recentLogs);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleGlobalRefresh = () => {
    loadMetrics();
    refreshMaterialsData();
  };

  return (
    <div className="admin-container">
      {/* Header Flat */}
      <div className="admin-header">
        <div>
          <button type="button" className="btn-admin-back" onClick={onBackToSite}>
            <ArrowLeft size={16} />
            <span>Voltar ao Site</span>
          </button>
          <h1 className="admin-title">Painel de Coordenação</h1>
          <p className="admin-subtitle">Gestão em tempo real da campanha do Pastor Ezequias</p>
        </div>

        <button
          type="button"
          className="btn-admin-refresh"
          onClick={handleGlobalRefresh}
          disabled={isGlobalLoading}
        >
          <RefreshCw size={15} className={isGlobalLoading ? 'spinner' : ''} />
          <span>{isGlobalLoading ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`admin-toast-feedback ${feedbackMsg.type}`}>
          <AlertCircle size={16} />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Modern Clean Flat Navigation Bar */}
      <div className="admin-action-bar-flat">
        <div className="action-bar-label">
          <Layers size={15} className="text-gold" />
          <span>Módulos de Gestão</span>
        </div>
      </div>

      <nav className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <ShoppingBag size={18} />
          <span>Pedidos de Materiais ({requests.length})</span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Settings size={18} />
          <span>Catálogo & WhatsApp</span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 size={18} />
          <span>Métricas de Fotos</span>
        </button>
      </nav>

      {activeTab === 'metrics' && <AdminMetricsTab metrics={metrics} logs={logs} />}

      {activeTab === 'materials' && (
        <AdminMaterialsRequestsTab
          requests={requests}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          onStatusFilterChange={setStatusFilter}
          onSearchTermChange={setSearchTerm}
          onStatusChange={handleStatusChange}
          onExportCSV={exportToCSV}
        />
      )}

      {activeTab === 'catalog' && (
        <AdminCatalogSettingsTab
          catalog={catalog}
          whatsappNumber={whatsappNumber}
          isSavingSetting={isSavingSetting}
          onSaveItem={handleSaveCatalogItem}
          onDeleteItem={handleDeleteCatalogItem}
          onSeedDefaults={handleSeedDefaults}
          onSaveWhatsapp={handleSaveWhatsapp}
        />
      )}
    </div>
  );
};
