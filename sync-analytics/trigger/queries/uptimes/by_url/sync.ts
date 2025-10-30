import { UPTIME_BY_URL_QUERY } from './query';
import { createAnalyticsSyncTask } from '@/trigger/sync';
import { persistUptimes } from '../persist';

export const syncAnalyticsUptimesByUrlTask = createAnalyticsSyncTask({
  name: 'uptimes-by-url',
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  machine: 'small-1x',
  query: UPTIME_BY_URL_QUERY,
  persist: persistUptimes,
});
