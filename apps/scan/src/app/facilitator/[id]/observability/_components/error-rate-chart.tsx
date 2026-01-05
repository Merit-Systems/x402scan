'use client';

import { BaseChart } from '@/components/ui/charts/chart/chart';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Area } from 'recharts';
import { LoadingChart } from './loading-chart';
import { useObservabilityDataParams } from './use-observability-data';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/trpc/client';

type Props = {
  facilitatorName: string;
};

export const ErrorRateChart: React.FC<Props> = ({ facilitatorName }) => {
  const params = useObservabilityDataParams();
  const { data, isLoading } =
    api.public.facilitatorObservability.errorRate.useQuery({
      facilitatorName,
      ...params,
    });

  if (isLoading) {
    return (
      <LoadingChart
        title="Error Rate (4xx + 5xx)"
        legendItems={[{ label: 'Error Rate' }]}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Error Rate (4xx + 5xx)
          </CardTitle>
        </CardHeader>
        <div className="text-center text-muted-foreground py-8 px-4">
          No error rate data available
        </div>
      </Card>
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
            Error Rate (4xx + 5xx)
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
            label: 'Error Rate',
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
