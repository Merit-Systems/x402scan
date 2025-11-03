import { db } from '@/services/db';
import { logger } from '@trigger.dev/sdk';
import { MetricsByResource } from '../types';
import { mapMetric } from '../utils';
import { Prisma } from '@prisma/client';

export async function persistMetrics(data: unknown): Promise<Prisma.BatchPayload> {
  const metrics: MetricsByResource[] = data as MetricsByResource[];
  const resources = metrics.map(m => m.resource);
  const resourcesInDb = await db.resources.findMany({
    where: {
      resource: {
        in: resources,
      },
    },
    select: {
      id: true,
      resource: true,
    },
  });

  const urlToResourceId = new Map(resourcesInDb.map(r => [r.resource, r.id]));

  const metricsWithResourceId = metrics
    .map(metric => {
      const resourceId = urlToResourceId.get(metric.resource);
      if (!resourceId) {
        logger.warn('No Resource found for resource', {
          resource: metric.resource,
        });
        return null;
      }
      return {
        resourceId,
        ...mapMetric(metric),
      };
    })
    .filter(m => m !== null);

  if (metricsWithResourceId.length === 0) {
    return { count: 0 };
  }
  return await db.resourceMetrics.createMany({
    data: metricsWithResourceId,
  });
}
