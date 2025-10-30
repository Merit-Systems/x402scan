import { UPTIME_QUERY } from './query';
import { createAnalyticsSyncTask } from '@/trigger/sync';
import { persistUptimes } from './persist';

export const syncAnalyticsUptimesTask = createAnalyticsSyncTask({
  name: 'uptimes',
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  machine: 'small-1x',
  query: UPTIME_QUERY,
  persist: persistUptimes,
});
