import { logger, schedules } from '@trigger.dev/sdk';
import { SyncConfig } from './types';
import { createClient } from '@clickhouse/client';

export function createAnalyticsSyncTask(config: SyncConfig) {
  const clickhouse = createClient({
    url: process.env.CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
  });
  return schedules.task({
    id: 'sync-analytics-' + config.name,
    cron: config.cron,
    maxDuration: config.maxDuration,
    machine: config.machine,
    run: async () => {
      try {
        logger.log('Fetching data for ' + config.name);
        const resultSet = await clickhouse.query({
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
