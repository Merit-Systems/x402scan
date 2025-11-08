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

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

function calculateHealthStatus(metrics?: HealthMetrics | null): {
  status: HealthStatus;
  reason: string;
} {
  if (!metrics?.totalCount24h) {
    return { status: 'unknown', reason: 'No data available' };
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
    return {
      status: 'healthy',
      reason: `${uptime.toFixed(1)}% uptime, ${errorRate.toFixed(1)}% errors`,
    };
  }

  if (uptime < 95 || errorRate > 10 || serverErrorRate > 5) {
    return {
      status: 'unhealthy',
      reason:
        uptime < 95
          ? `Low uptime: ${uptime.toFixed(1)}%`
          : `High error rate: ${errorRate.toFixed(1)}%`,
    };
  }

  return {
    status: 'degraded',
    reason: `${uptime.toFixed(1)}% uptime, ${errorRate.toFixed(1)}% errors`,
  };
}

export const HealthIndicator: React.FC<Props> = ({ metrics }) => {
  const { status, reason } = calculateHealthStatus(metrics);

  const config = {
    healthy: {
      Icon: CircleCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Healthy',
    },
    degraded: {
      Icon: CircleAlert,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      label: 'Degraded',
    },
    unhealthy: {
      Icon: CircleX,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Unhealthy',
    },
    unknown: {
      Icon: Circle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      label: 'Unknown',
    },
  }[status];

  const { Icon, color, bgColor, borderColor, label } = config;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="text-xs">
          <div className="font-semibold mb-1">Health Status (24h)</div>
          <div className="mb-2">{reason}</div>
          {metrics?.totalCount24h && (
            <div className="space-y-0.5 opacity-80">
              <div>Requests: {metrics.totalCount24h.toLocaleString()}</div>
              {metrics.uptime24hPct !== null &&
                metrics.uptime24hPct !== undefined && (
                  <div>Uptime: {metrics.uptime24hPct.toFixed(2)}%</div>
                )}
              {metrics.p99_24hMs && (
                <div>P99 Latency: {metrics.p99_24hMs}ms</div>
              )}
              {metrics.count_2xx_24h !== null && (
                <div>Success: {metrics.count_2xx_24h?.toLocaleString()}</div>
              )}
              {metrics.count_4xx_24h !== null && (
                <div>4xx Errors: {metrics.count_4xx_24h?.toLocaleString()}</div>
              )}
              {metrics.count_5xx_24h !== null && (
                <div>5xx Errors: {metrics.count_5xx_24h?.toLocaleString()}</div>
              )}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
