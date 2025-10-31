import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByUrl } from '../types';

export async function persistMetrics(data: unknown) {
  try {
    logger.log('Persisting metrics by url', { data });

    const metrics: MetricsByUrl[] = data as MetricsByUrl[];

      logger.log('Fetched metrics by url', { count: metrics.length });

    await db.uptime.createMany({
      data: metrics.map(metric => ({
        url: metric.url,
        totalCount24h: parseInt(metric.total_count_24h.toString()),
        uptime1hPct: metric.uptime_1h_pct,
        uptime6hPct: metric.uptime_6h_pct,
        uptime24hPct: metric.uptime_24h_pct,
        uptimeAllTimePct: metric.uptime_all_time_pct,
      })),
      skipDuplicates: true,
    });

    } catch (error) {
      logger.error('Error in metrics by url sync task:', {
        error: String(error),
      });
      throw error;
    }
}
