import { sql } from '../config/database';
import type { CampaignMetrics, ActivityLogItem } from '../types/analytics';
import { CAMPAIGN_COUNTER_ID, DOWNLOADS_COUNTER_ID } from './counterService';

export async function fetchAdminMetrics(): Promise<{
  metrics: CampaignMetrics;
  recentLogs: ActivityLogItem[];
}> {
  try {
    // 1. Busca os contadores principais
    const counters = await sql`
      SELECT id, count, updated_at
      FROM campaign_counters
      WHERE id IN (${CAMPAIGN_COUNTER_ID}, ${DOWNLOADS_COUNTER_ID});
    `;

    let totalVisits = 0;
    let totalDownloads = 0;
    let lastUpdated = new Date().toISOString();

    for (const row of counters) {
      if (row.id === CAMPAIGN_COUNTER_ID) {
        totalVisits = Number(row.count) || 0;
        if (row.updated_at) lastUpdated = new Date(row.updated_at).toLocaleString('pt-BR');
      } else if (row.id === DOWNLOADS_COUNTER_ID) {
        totalDownloads = Number(row.count) || 0;
      }
    }

    const conversionRate =
      totalVisits > 0 ? Number(((totalDownloads / totalVisits) * 100).toFixed(1)) : 0;

    // 2. Busca os últimos 10 logs de atividade
    const logRows = await sql`
      SELECT id, event_type, created_at
      FROM supporters_log
      ORDER BY id DESC
      LIMIT 10;
    `;

    const recentLogs: ActivityLogItem[] = (logRows || []).map((r) => ({
      id: Number(r.id),
      eventType: r.event_type === 'download' ? 'download' : 'visit',
      createdAt: new Date(r.created_at).toLocaleString('pt-BR'),
    }));

    return {
      metrics: {
        totalVisits,
        totalDownloads,
        conversionRate,
        lastUpdated,
      },
      recentLogs,
    };
  } catch (err) {
    console.error('Erro ao buscar métricas administrativas no Neon DB:', err);
    return {
      metrics: {
        totalVisits: 0,
        totalDownloads: 0,
        conversionRate: 0,
        lastUpdated: new Date().toLocaleString('pt-BR'),
      },
      recentLogs: [],
    };
  }
}
