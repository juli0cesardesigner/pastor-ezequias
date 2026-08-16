import React, { useEffect, useState } from 'react';
import { Download, Users, TrendingUp, RefreshCw, Activity, ArrowLeft } from 'lucide-react';
import { fetchAdminMetrics } from '../../services/adminService';
import type { CampaignMetrics, ActivityLogItem } from '../../types/analytics';
import { CAMPAIGN_CONFIG } from '../../config/campaign';
import './AdminPage.css';

interface AdminPageProps {
  onBackToSite: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToSite }) => {
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    totalVisits: 0,
    totalDownloads: 0,
    conversionRate: 0,
    lastUpdated: '',
  });
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminMetrics();
      setMetrics(data.metrics);
      setLogs(data.recentLogs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <div className="admin-header-left">
          <button type="button" className="btn-admin-back" onClick={onBackToSite}>
            <ArrowLeft size={16} />
            <span>Ver Gerador de Fotos</span>
          </button>
          <h1 className="admin-title">
            Painel da Campanha — <span className="highlight">{CAMPAIGN_CONFIG.candidateName}</span>
          </h1>
          <p className="admin-subtitle">
            Métricas em tempo real sincronizadas com o banco de dados Neon DB
          </p>
        </div>

        <button
          type="button"
          className={`btn-admin-refresh ${isLoading ? 'loading' : ''}`}
          onClick={loadData}
          disabled={isLoading}
          title="Atualizar dados agora"
        >
          <RefreshCw size={16} className={isLoading ? 'spin-icon' : ''} />
          <span>{isLoading ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="admin-metrics-grid">
        {/* Card 1: Downloads Reais */}
        <div className="metric-card spotlight-metric glass-card">
          <div className="metric-card-header">
            <div className="metric-icon-box download-bg">
              <Download size={22} />
            </div>
            <span className="metric-badge-live">Contagem Real</span>
          </div>
          <div className="metric-value">
            {metrics.totalDownloads.toLocaleString('pt-BR')}
          </div>
          <div className="metric-label">Fotos Reais Baixadas</div>
          <p className="metric-desc">Total de apoiadores que geraram e baixaram a imagem final</p>
        </div>

        {/* Card 2: Acessos / Visitas */}
        <div className="metric-card glass-card">
          <div className="metric-card-header">
            <div className="metric-icon-box visit-bg">
              <Users size={22} />
            </div>
            <span className="metric-badge-subtle">Contador Público</span>
          </div>
          <div className="metric-value">{metrics.totalVisits.toLocaleString('pt-BR')}</div>
          <div className="metric-label">Visitas Computadas</div>
          <p className="metric-desc">Acessos únicos registrados com intervalo anti-spam de 1h</p>
        </div>

        {/* Card 3: Taxa de Conversão */}
        <div className="metric-card glass-card">
          <div className="metric-card-header">
            <div className="metric-icon-box conversion-bg">
              <TrendingUp size={22} />
            </div>
            <span className="metric-badge-subtle">Engajamento</span>
          </div>
          <div className="metric-value">{metrics.conversionRate}%</div>
          <div className="metric-label">Taxa de Conversão</div>
          <p className="metric-desc">Percentual de visitantes que concluíram o download da foto</p>
        </div>
      </div>

      {/* Histórico Recente de Atividade */}
      <div className="admin-logs-section glass-card">
        <div className="logs-header">
          <div className="logs-title">
            <Activity size={18} className="text-gold" />
            <span>Últimos Eventos Registrados</span>
          </div>
          <span className="logs-last-sync">Atualizado em: {metrics.lastUpdated}</span>
        </div>

        {logs.length === 0 ? (
          <div className="logs-empty">Nenhum evento registrado ainda.</div>
        ) : (
          <div className="logs-list">
            {logs.map((item) => (
              <div key={item.id} className="log-row">
                <div className="log-type-tag">
                  {item.eventType === 'download' ? (
                    <span className="badge-download">📥 Download de Imagem</span>
                  ) : (
                    <span className="badge-visit">👁️ Acesso à Página</span>
                  )}
                </div>
                <div className="log-time">{item.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
