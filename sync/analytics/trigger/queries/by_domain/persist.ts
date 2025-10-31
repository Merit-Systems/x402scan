import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByDomain } from '../types';
import { mapMetric } from '../utils';

export async function persistMetrics(data: unknown) {
  try {
    const metrics: MetricsByDomain[] = data as MetricsByDomain[];

    logger.log('Fetched metrics from analytics', { count: metrics.length });

    await db.resourceDomainMetrics.createMany({
      data: metrics.map(metric => ({
        domain: metric.domain,
        ...mapMetric(metric),
      })),
    });

    } catch (error) {
      logger.error('Error in uptimes sync task:', {
        error: String(error),
      });
      throw error;
    }
}
