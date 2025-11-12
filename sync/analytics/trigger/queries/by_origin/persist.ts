import { scanDb } from '@repo/scan-db';
import { logger } from '@trigger.dev/sdk';
import type { MetricsByOrigin } from '../types';
import { mapMetric } from '../utils';
import type { Prisma } from '@repo/scan-db';

export async function persistMetrics(
  data: unknown
): Promise<Prisma.BatchPayload> {
  const metrics: MetricsByOrigin[] = data as MetricsByOrigin[];

  const originToId = new Map<string, string>();

  for (const metric of metrics) {
    const origin = await scanDb.resourceOrigin.findFirst({
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
      originToId.set(metric.origin, origin.id);
    }
  }

  const metricsWithOriginId = metrics
    .map(metric => {
      const originId = originToId.get(metric.origin);
      if (!originId) {
        logger.warn('No ResourceOrigin found for origin', {
          origin: metric.origin,
        });
        return null;
      }
      return {
        originId,
        ...mapMetric(metric),
      };
    })
    .filter(m => m !== null);

  if (metricsWithOriginId.length === 0) {
    return { count: 0 };
  }
  return await scanDb.resourceOriginMetrics.createMany({
    data: metricsWithOriginId,
  });
}
