import { logger, schedules } from '@trigger.dev/sdk';
import type { SyncConfig } from './types';
import { analyticsDb } from '@x402scan/analytics-db';

export function createAnalyticsSyncTask(config: SyncConfig) {
  return schedules.task({
    id: 'sync-' + config.name,
    cron: config.cron,
    maxDuration: config.maxDuration,
    machine: config.machine,
    run: async () => {
      try {
        logger.log('Fetching data for ' + config.name);
        const resultSet = await analyticsDb.query({
          query: config.query,
          format: 'JSONEachRow',
        });
        const data = await resultSet.json();
        logger.log('Fetched data: ' + data.length);
        const result = await config.persist(data);
        logger.log('Persisted metrics: ' + result.count);
      } catch (error) {
        logger.error('Error syncing analytics: ' + String(error));
        throw error;
      }
    },
  });
}
