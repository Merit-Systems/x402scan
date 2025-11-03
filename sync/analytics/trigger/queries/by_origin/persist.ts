import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByOrigin } from '../types';
import { mapMetric } from '../utils';

export async function persistMetrics(data: unknown) {
  try {
    const metrics: MetricsByOrigin[] = data as MetricsByOrigin[];

    logger.log('Fetched metrics from analytics', { count: metrics.length });

    const originMap = new Map<string, string>();

    for (const metric of metrics) {
      const origin = await db.resourceOrigin.findFirst({
        where: {
          origin: {
            mode: 'insensitive',
            endsWith: metric.origin,
          },
        },
        select: {
          id: true,
          origin: true,
        },
      });

      if (origin) {
        originMap.set(metric.origin, origin.id);
      }
    }

    const metricsWithOriginId = metrics
      .map(metric => {
        const originId = originMap.get(metric.origin);
        if (!originId) {
          logger.warn('No ResourceOrigin found for origin', { origin: metric.origin });
          return null;
        }
        return {
          originId,
          ...mapMetric(metric),
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (metricsWithOriginId.length === 0) {
      logger.warn('No metrics to persist after origin lookup');
      return;
    }

    await db.resourceOriginMetrics.createMany({
      data: metricsWithOriginId,
    });

    logger.log('Persisted origin metrics', {
      count: metricsWithOriginId.length,
      skipped: metrics.length - metricsWithOriginId.length,
    });

  } catch (error) {
    logger.error('Error in uptimes sync task:', {
      error: String(error),
    });
    throw error;
  }
}
