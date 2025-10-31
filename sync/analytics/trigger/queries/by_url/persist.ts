import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByUrl } from '../types';
import { mapMetric } from "../utils";

export async function persistMetrics(data: unknown) {
  try {
    logger.log('Persisting metrics by url', { data });

    const metrics: MetricsByUrl[] = data as MetricsByUrl[];

    logger.log('Fetched metrics by url', { count: metrics.length });

    for (const metric of metrics) {
      await db.resourceUrlMetrics.upsert({
        where: { url: metric.url },
        create: {
          url: metric.url,
          ...mapMetric(metric),
        },
        update: {
          ...mapMetric(metric),
        },
      });
    }

    } catch (error) {
      logger.error('Error in metrics by url sync task:', {
        error: String(error),
      });
      throw error;
    }
}
