import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { Uptime } from './type';

export async function persistUptimes(data: unknown) {
  try {
    logger.log('Persisting uptimes', { data });

    const uptimes: Uptime[] = data as Uptime[];

      logger.log('Fetched uptimes from analytics', { count: uptimes.length });

    await db.uptime.createMany({
      data: uptimes.map(uptime => ({
        url: uptime.url,
        totalCount24h: parseInt(uptime.total_count_24h.toString()),
        uptime1hPct: uptime.uptime_1h_pct,
        uptime6hPct: uptime.uptime_6h_pct,
        uptime24hPct: uptime.uptime_24h_pct,
        uptimeAllTimePct: uptime.uptime_all_time_pct,
      })),
      skipDuplicates: true,
    });

    } catch (error) {
      logger.error('Error in uptimes sync task:', {
        error: String(error),
      });
      throw error;
    }
}
