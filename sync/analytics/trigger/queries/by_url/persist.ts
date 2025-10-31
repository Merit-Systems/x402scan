import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByUrl } from '../types';
import { mapMetric } from "../utils";

export async function persistMetrics(data: unknown) {
  try {
    const metrics: MetricsByUrl[] = data as MetricsByUrl[];

    logger.log('Fetched metrics by url', { count: metrics.length });

    await db.resourceUrlMetrics.createMany({
      data: metrics.map(metric => ({
        url: metric.url,
        ...mapMetric(metric),
      })),
    });

    } catch (error) {
      logger.error('Error in metrics by url sync task:', {
        error: String(error),
      });
      throw error;
    }
}
