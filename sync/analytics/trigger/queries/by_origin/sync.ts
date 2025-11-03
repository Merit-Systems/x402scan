import { METRICS_BY_DOMAIN_QUERY } from './query';
import { createAnalyticsSyncTask } from '@/trigger/sync';
import { persistMetrics } from './persist';

export const syncAnalyticsMetricsByDomainTask = createAnalyticsSyncTask({
  name: 'metrics-by-origin',
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  machine: 'small-1x',
  query: METRICS_BY_DOMAIN_QUERY,
  persist: persistMetrics,
});
