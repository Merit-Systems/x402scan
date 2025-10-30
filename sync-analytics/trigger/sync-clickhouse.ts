import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@clickhouse/client';
import { UPTIME_QUERY } from './queries/uptimes/query';
import { db } from '@/services/db';
import { Uptime } from './queries/uptimes/type';

export const syncClickhouseTask = schedules.task({
  id: 'sync-clickhouse-resource-invocations',
  cron: '0 * * * *',
  maxDuration: 1800, // 30 minutes
  run: async () => {
    try {
      logger.log('Starting ClickHouse sync task', { timestamp: new Date() });

      const clickhouse = createClient({
        url: process.env.CLICKHOUSE_URL,
        username: process.env.CLICKHOUSE_USER,
        password: process.env.CLICKHOUSE_PASSWORD,
      });

      const resultSet = await clickhouse.query({
        query: UPTIME_QUERY,
        format: 'JSONEachRow',
      });

      const uptimes: Uptime[] = await resultSet.json();

      logger.log('Fetched uptimes from ClickHouse', { count: uptimes.length });

      // Upsert each uptime record (update if exists, create if not)
      let upsertedCount = 0;
      for (const uptime of uptimes) {
        await db.uptime.upsert({
          where: { url: uptime.url },
          update: {
            totalCount24h: parseInt(uptime.total_count_24h.toString()),
            uptime1hPct: uptime.uptime_1h_pct,
            uptime6hPct: uptime.uptime_6h_pct,
            uptime24hPct: uptime.uptime_24h_pct,
            uptimeAllTimePct: uptime.uptime_all_time_pct,
            updatedAt: new Date(),
          },
          create: {
            url: uptime.url,
            totalCount24h: parseInt(uptime.total_count_24h.toString()),
            uptime1hPct: uptime.uptime_1h_pct,
            uptime6hPct: uptime.uptime_6h_pct,
            uptime24hPct: uptime.uptime_24h_pct,
            uptimeAllTimePct: uptime.uptime_all_time_pct,
          },
        });
        upsertedCount++;
      }

      logger.log('ClickHouse sync task completed successfully', {
        upserted: upsertedCount,
      });
    } catch (error) {
      logger.error('Error in ClickHouse sync task:', {
        error: String(error),
      });
      throw error;
    }
  },
});
