import { HealthStatus, type HealthMetrics } from './types';
import { TOTAL_REQUESTS_THRESHOLD, HEALTH_THRESHOLDS } from './constants';

export function calculateHealthStatus(
  metrics?: HealthMetrics | null
): HealthStatus {
  if (
    !metrics?.totalCount24h ||
    metrics?.totalCount24h < TOTAL_REQUESTS_THRESHOLD
  ) {
    return HealthStatus.Unknown;
  }

  const uptime = metrics.uptime24hPct ?? 0;
  const total = metrics.totalCount24h ?? 0;
  const errors5xx = metrics.count_5xx_24h ?? 0;
  const errors4xx = metrics.count_4xx_24h ?? 0;

  const errorRate = total > 0 ? ((errors5xx + errors4xx) / total) * 100 : 0;
  const serverErrorRate = total > 0 ? (errors5xx / total) * 100 : 0;

  if (
    uptime >= HEALTH_THRESHOLDS.healthy.uptime &&
    errorRate < HEALTH_THRESHOLDS.healthy.errorRate &&
    serverErrorRate < HEALTH_THRESHOLDS.healthy.serverErrorRate
  ) {
    return HealthStatus.Healthy;
  }

  if (
    uptime < HEALTH_THRESHOLDS.unhealthy.uptime ||
    errorRate > HEALTH_THRESHOLDS.unhealthy.errorRate ||
    serverErrorRate > HEALTH_THRESHOLDS.unhealthy.serverErrorRate
  ) {
    return HealthStatus.Unhealthy;
  }

  return HealthStatus.Degraded;
}
