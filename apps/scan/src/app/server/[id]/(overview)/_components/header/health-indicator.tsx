'use client';

import { Circle, CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ResourceOriginMetrics } from '@prisma/client';

type HealthMetrics = Pick<
  ResourceOriginMetrics,
  | 'uptime24hPct'
  | 'totalCount24h'
  | 'count_5xx_24h'
  | 'count_4xx_24h'
  | 'count_2xx_24h'
  | 'p99_24hMs'
>;

interface Props {
  metrics?: HealthMetrics | null;
}

enum HealthStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Unknown = 'unknown',
}

function calculateHealthStatus(metrics?: HealthMetrics | null): HealthStatus {
  if (!metrics?.totalCount24h) {
    return HealthStatus.Unknown;
  }

  const uptime = metrics.uptime24hPct ?? 0;
  const total = metrics.totalCount24h ?? 0;
  const errors5xx = metrics.count_5xx_24h ?? 0;
  const errors4xx = metrics.count_4xx_24h ?? 0;
  const p99Latency = metrics.p99_24hMs ?? 0;

  const errorRate = total > 0 ? ((errors5xx + errors4xx) / total) * 100 : 0;
  const serverErrorRate = total > 0 ? (errors5xx / total) * 100 : 0;

  if (
    uptime >= 99 &&
    errorRate < 5 &&
    serverErrorRate < 1 &&
    p99Latency < 8000
  ) {
    return HealthStatus.Healthy;
  }

  if (uptime < 95 || errorRate > 10 || serverErrorRate > 5) {
    return HealthStatus.Unhealthy;
  }

  return HealthStatus.Degraded;
}

export const HealthIndicator: React.FC<Props> = ({ metrics }) => {
  const status = calculateHealthStatus(metrics);

  const config = {
    [HealthStatus.Healthy]: {
      Icon: CircleCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Healthy',
    },
    [HealthStatus.Degraded]: {
      Icon: CircleAlert,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      label: 'Degraded',
    },
    [HealthStatus.Unhealthy]: {
      Icon: CircleX,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Unhealthy',
    },
    [HealthStatus.Unknown]: {
      Icon: Circle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      label: 'Unknown',
    },
  }[status];

  const { Icon, color, bgColor, borderColor, label } = config;

  const badge = (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1 py-0.5 rounded-full border',
        'text-xs font-medium cursor-default',
        bgColor,
        borderColor
      )}
    >
      <Icon className={cn('size-3', color)} />
      <span className={cn(color, 'text-xs')}>{label}</span>
    </div>
  );

  if (status === HealthStatus.Unknown) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="text-xs">
          <div className="font-semibold mb-1">Health Status (24h)</div>
          {metrics?.totalCount24h && (
            <div className="space-y-0.5 opacity-80">
              <div className="flex justify-between gap-4">
                <span>Requests:</span>
                <span>{metrics.totalCount24h.toLocaleString()}</span>
              </div>
              {metrics.uptime24hPct !== null && (
                <div className="flex justify-between gap-4">
                  <span>Uptime:</span>
                  <span>{metrics.uptime24hPct.toFixed(0)}%</span>
                </div>
              )}
              {metrics.p99_24hMs && (
                <div className="flex justify-between gap-4">
                  <span>P99 Latency:</span>
                  <span>{metrics.p99_24hMs}ms</span>
                </div>
              )}
              {metrics.count_2xx_24h !== null && (
                <div className="flex justify-between gap-4">
                  <span>Success:</span>
                  <span>{metrics.count_2xx_24h?.toLocaleString()}</span>
                </div>
              )}
              {metrics.count_4xx_24h !== null && (
                <div className="flex justify-between gap-4">
                  <span>4xx Errors:</span>
                  <span>{metrics.count_4xx_24h?.toLocaleString()}</span>
                </div>
              )}
              {metrics.count_5xx_24h !== null && (
                <div className="flex justify-between gap-4">
                  <span>5xx Errors:</span>
                  <span>{metrics.count_5xx_24h?.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
