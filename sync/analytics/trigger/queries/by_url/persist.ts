import { db } from "@/services/db";
import { logger } from "@trigger.dev/sdk";
import { MetricsByUrl } from '../types';
import { mapMetric } from "../utils";

export async function persistMetrics(data: unknown) {
  try {
    const metrics: MetricsByUrl[] = data as MetricsByUrl[];

    logger.log('Fetched metrics by url', { count: metrics.length });

    // Look up all resources to get their IDs
    const urls = metrics.map(m => m.url);
    const resources = await db.resources.findMany({
      where: {
        resource: {
          in: urls,
        },
      },
      select: {
        id: true,
        resource: true,
      },
    });

    // Create a map of url -> resourceId
    const urlToResourceId = new Map(
      resources.map(r => [r.resource, r.id])
    );

    // Filter out metrics for URLs that don't have a Resource yet
    const metricsWithResourceId = metrics
      .map(metric => {
        const resourceId = urlToResourceId.get(metric.url);
        if (!resourceId) {
          logger.warn('No Resource found for URL', { url: metric.url });
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
