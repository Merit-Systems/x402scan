import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByDomain } from '../types';
import { mapMetric } from '../utils';

export async function persistMetrics(data: unknown) {
  try {
    logger.log('Persisting uptimes', { data });

    const metrics: MetricsByDomain[] = data as MetricsByDomain[];

    logger.log('Fetched metrics from analytics', { count: metrics.length });

    for (const metric of metrics) {
      await db.resourceDomainMetrics.upsert({
        where: { domain: metric.domain },
        create: {
          domain: metric.domain,
          ...mapMetric(metric),
        },
        update: {
          ...mapMetric(metric),
        },
      });
    }

    } catch (error) {
      logger.error('Error in uptimes sync task:', {
        error: String(error),
      });
      throw error;
    }
}
