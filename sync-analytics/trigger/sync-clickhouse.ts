import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@clickhouse/client';

export const syncClickhouseTask = schedules.task({
  id: 'sync-clickhouse-resource-invocations',
  // Run every hour
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  run: async payload => {
    try {
      logger.log('Starting ClickHouse sync task', { timestamp: new Date() });

      const clickhouse = createClient({
        url: process.env.CLICKHOUSE_URL,
        username: process.env.CLICKHOUSE_USER,
        password: process.env.CLICKHOUSE_PASSWORD,
      });

      const resultSet = await clickhouse.query({
        query: 'SELECT * FROM resource_invocations LIMIT 10',
        format: 'JSONEachRow',
      });

      const data = await resultSet.json();

      logger.log('Fetched resource invocations from ClickHouse', {
        count: data.length,
        sample: data[0],
      });

      // TODO: Process and store data in the scan database

      logger.log('ClickHouse sync task completed successfully');
    } catch (error) {
      logger.error('Error in ClickHouse sync task:', {
        error: String(error),
      });
      throw error;
    }
  },
});
