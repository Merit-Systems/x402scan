'use client';

import { BaseChart } from '@/components/ui/charts/chart/chart';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Area } from 'recharts';
import { LoadingChart } from './loading-chart';
import { useObservabilityData } from './use-observability-data';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorRateData {
  ts: string;
  total_requests: string;
  error_requests: string;
  error_rate: string;
}

interface Props {
  originUrl: string;
  resourceUrl?: string;
}

const ERROR_RATE_ENDPOINT = '/api/observability/error-rate';

export const ErrorRateChart: React.FC<Props> = ({ originUrl, resourceUrl }) => {
  const { data, isLoading } = useObservabilityData<ErrorRateData>({
    endpoint: ERROR_RATE_ENDPOINT,
    originUrl,
    resourceUrl,
  });

  if (isLoading) {
    return (
      <LoadingChart
        title="Server Error Rate"
        legendItems={[{ label: 'Error Rate' }]}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No error rate data available
      </div>
    );
  }

  const chartData: ChartData<{
    errorRate: number;
  }>[] = data.map(item => {
    const date = new Date(item.ts + 'Z');
    const formatted = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      timestamp: formatted,
      errorRate: parseFloat(item.error_rate),
    };
  });

  return (
    <Card className="w-full">
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Server Error Rate
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-xs">Error Rate</span>
          </div>
        </div>
      </CardHeader>
      <BaseChart
        type="composed"
        data={chartData}
        height={120}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        yAxes={[
          {
            domain: [0, 100],
            hide: true,
          },
        ]}
        tooltipRows={[
          {
            key: 'errorRate',
            label: 'Server Error Rate',
            getValue: data => `${data.toFixed(2)}%`,
            dotColor: '#ef4444',
          },
        ]}
        xAxis={{
          show: false,
          height: 0,
        }}
      >
        <defs>
          <linearGradient id="errorRate-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="errorRate"
          stroke="#ef4444"
          fill="url(#errorRate-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
      </BaseChart>
    </Card>
  );
};
