import React from 'react';
import { Download, Users, TrendingUp, Activity } from 'lucide-react';
import type { CampaignMetrics, ActivityLogItem } from '../../../types/analytics';

interface AdminMetricsTabProps {
  metrics: CampaignMetrics;
  logs: ActivityLogItem[];
}

export const AdminMetricsTab: React.FC<AdminMetricsTabProps> = ({ metrics, logs }) => {
  return (
    <div className="admin-tab-content">
      <div className="admin-metrics-grid">
        <div className="stat-flat-card highlight-stat">
          <div className="stat-flat-header">
            <div className="stat-icon-box download-bg">
              <Download size={20} />
            </div>
            <span className="stat-badge-gold">Contagem Real</span>
          </div>
          <div className="stat-flat-value">{metrics.totalDownloads.toLocaleString('pt-BR')}</div>
          <div className="stat-flat-label">Fotos Reais Baixadas</div>
          <p className="stat-flat-desc">Apoiadores que baixaram a foto final</p>
        </div>

        <div className="stat-flat-card">
          <div className="stat-flat-header">
            <div className="stat-icon-box visit-bg">
              <Users size={20} />
            </div>
            <span className="stat-badge-subtle">Contador Público</span>
          </div>
          <div className="stat-flat-value">{metrics.totalVisits.toLocaleString('pt-BR')}</div>
          <div className="stat-flat-label">Visitas Computadas</div>
          <p className="stat-flat-desc">Acessos com proteção anti-spam</p>
        </div>

        <div className="stat-flat-card">
          <div className="stat-flat-header">
            <div className="stat-icon-box conversion-bg">
              <TrendingUp size={20} />
            </div>
            <span className="stat-badge-subtle">Engajamento</span>
          </div>
          <div className="stat-flat-value">{metrics.conversionRate}%</div>
          <div className="stat-flat-label">Taxa de Conversão</div>
          <p className="stat-flat-desc">Visitantes que geraram fotos</p>
        </div>
      </div>

      <div className="admin-section-flat">
        <div className="section-flat-header space-between">
          <div className="setting-title-wrap">
            <Activity size={18} className="text-gold" />
            <h3 className="section-flat-title">Últimos Eventos Registrados</h3>
          </div>
          <span className="logs-last-sync">Atualizado em: {metrics.lastUpdated}</span>
        </div>

        {logs.length === 0 ? (
          <div className="logs-empty-flat">Nenhum evento registrado ainda.</div>
        ) : (
          <div className="logs-flat-list">
            {logs.map((item) => (
              <div key={item.id} className="log-flat-row">
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
