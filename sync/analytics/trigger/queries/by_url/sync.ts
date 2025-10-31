import { METRICS_BY_URL_QUERY } from './query';
import { createAnalyticsSyncTask } from '@/trigger/sync';
import { persistMetrics } from './persist';

export const syncAnalyticsMetricsByUrlTask = createAnalyticsSyncTask({
  name: 'metrics-by-url',
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  machine: 'small-1x',
  query: METRICS_BY_URL_QUERY,
  persist: persistMetrics,
});
