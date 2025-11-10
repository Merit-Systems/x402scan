import { formatCompactAgo } from '@/lib/utils';
import { TOTAL_REQUESTS_THRESHOLD } from './constants';
import { HealthStatus, type HealthMetrics } from './types';

interface Props {
  status: HealthStatus;
  metrics?: HealthMetrics | null;
}

const TooltipFooter = () => (
  <div className="text-[10px] text-muted-foreground/60 mt-2 pt-2 border-t border-border/30 text-center">
    Data collected by the x402scan.com proxy
  </div>
);

export const HealthTooltipContent: React.FC<Props> = ({ status, metrics }) => {
  if (status === HealthStatus.Unknown) {
    return (
      <div className="space-y-2">
        <div className="space-y-0.5">
          <div className="flex justify-between gap-4">
            <span>
              Unable to determine status (fewer than {TOTAL_REQUESTS_THRESHOLD}{' '}
              requests in last 24h)
            </span>
          </div>
        </div>
        <TooltipFooter />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold">Health Status (24h)</div>
      {metrics?.totalCount24h && (
        <>
          <div className="space-y-0.5">
            {metrics.uptime24hPct !== null && (
              <div className="flex justify-between gap-4">
                <span>Uptime:</span>
                <span>{metrics.uptime24hPct.toFixed(2)}%</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/50" />

          <div className="space-y-0.5">
            {metrics.p50_24hMs && (
              <div className="flex justify-between gap-4">
                <span>P50 Latency:</span>
                <span>{(metrics.p50_24hMs / 1000).toFixed(2)}s</span>
              </div>
            )}
            {metrics.p90_24hMs && (
              <div className="flex justify-between gap-4">
                <span>P90 Latency:</span>
                <span>{(metrics.p90_24hMs / 1000).toFixed(2)}s</span>
              </div>
            )}
            {metrics.p99_24hMs && (
              <div className="flex justify-between gap-4">
                <span>P99 Latency:</span>
                <span>{(metrics.p99_24hMs / 1000).toFixed(2)}s</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/50" />

          <div className="space-y-0.5">
            <div className="flex justify-between gap-4">
              <span>Total Requests:</span>
              <span>{metrics.totalCount24h.toLocaleString()}</span>
            </div>
            {metrics.count_2xx_24h !== null && (
              <div className="flex justify-between gap-4">
                <span>Success (2xx):</span>
                <span>{metrics.count_2xx_24h?.toLocaleString()}</span>
              </div>
            )}
            {metrics.count_4xx_24h !== null && (
              <div className="flex justify-between gap-4">
                <span>Client Errors (4xx):</span>
                <span>{metrics.count_4xx_24h?.toLocaleString()}</span>
              </div>
            )}
            {metrics.count_5xx_24h !== null && (
              <div className="flex justify-between gap-4">
                <span>Server Errors (5xx):</span>
                <span>{metrics.count_5xx_24h?.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/50" />

          <div className="space-y-0.5">
            <div className="flex justify-between gap-4">
              <span>Last Updated:</span>
              <span>{formatCompactAgo(new Date(metrics.updatedAt))}</span>
            </div>
          </div>
        </>
      )}
      <TooltipFooter />
    </div>
  );
};
