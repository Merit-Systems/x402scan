import { METRICS_BY_RESOURCE_QUERY } from './query';
import { createAnalyticsSyncTask } from '@/trigger/sync';
import { persistMetrics } from './persist';

export const syncAnalyticsMetricsByUrlTask = createAnalyticsSyncTask({
  name: 'metrics-by-resource',
  cron: '0 * * * *',
  maxDuration: 600, // seconds
  machine: 'small-1x',
  query: METRICS_BY_RESOURCE_QUERY,
  persist: persistMetrics,
});
