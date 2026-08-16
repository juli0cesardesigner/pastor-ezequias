export interface CampaignMetrics {
  totalVisits: number;
  totalDownloads: number;
  conversionRate: number;
  lastUpdated: string;
}

export interface ActivityLogItem {
  id: number;
  eventType: 'visit' | 'download';
  createdAt: string;
}
