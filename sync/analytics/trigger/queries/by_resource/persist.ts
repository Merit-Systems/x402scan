import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByResource } from '../types';
import { mapMetric } from "../utils";

export async function persistMetrics(data: unknown) {
  try {
    const metrics: MetricsByResource[] = data as MetricsByResource[];

    logger.log('Fetched metrics by resource', { count: metrics.length });

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

    const urlToResourceId = new Map(
      resourcesInDb.map(r => [r.resource, r.id])
    );

    const metricsWithResourceId = metrics
      .map(metric => {
        const resourceId = urlToResourceId.get(metric.resource);
        if (!resourceId) {
          logger.warn('No Resource found for resource', { resource: metric.resource });
          return null;
        }
        return {
          resourceId,
          ...mapMetric(metric),
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (metricsWithResourceId.length === 0) {
      logger.warn('No metrics to persist after resource lookup');
      return;
    }

    await db.resourceMetrics.createMany({
      data: metricsWithResourceId,
    });

    logger.log('Persisted resource metrics', {
      count: metricsWithResourceId.length,
      skipped: metrics.length - metricsWithResourceId.length,
    });

  } catch (error) {
    logger.error('Error in metrics by url sync task:', {
      error: String(error),
    });
    throw error;
  }
}
