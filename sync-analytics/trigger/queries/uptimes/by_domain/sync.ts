import { UPTIME_BY_DOMAIN_QUERY } from './query';
import { createAnalyticsSyncTask } from '@/trigger/sync';
import { persistUptimes } from '../persist';

export const syncAnalyticsUptimesByDomainTask = createAnalyticsSyncTask({
  name: 'uptimes-by-domain',
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  machine: 'small-1x',
  query: UPTIME_BY_DOMAIN_QUERY,
  persist: persistUptimes,
});

