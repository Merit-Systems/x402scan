import type { ResourceOriginMetrics, ResourceMetrics } from '@prisma/client';

export enum HealthStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Unknown = 'unknown',
}

export type OriginHealthMetrics = Pick<
  ResourceOriginMetrics,
  | 'uptime24hPct'
  | 'totalCount24h'
  | 'count_5xx_24h'
  | 'count_4xx_24h'
  | 'count_2xx_24h'
  | 'p50_24hMs'
  | 'p90_24hMs'
  | 'p99_24hMs'
  | 'updatedAt'
>;

type ResourceHealthMetrics = Pick<
  ResourceMetrics,
  | 'uptime24hPct'
  | 'totalCount24h'
  | 'count_5xx_24h'
  | 'count_4xx_24h'
  | 'count_2xx_24h'
  | 'p50_24hMs'
  | 'p90_24hMs'
  | 'p99_24hMs'
  | 'updatedAt'
>;

export type HealthMetrics = OriginHealthMetrics | ResourceHealthMetrics;
