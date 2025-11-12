'use client';

import { BaseChart } from '@/components/ui/charts/chart/chart';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Line } from 'recharts';
import { LoadingChart } from './loading-chart';
import { useObservabilityData } from './use-observability-data';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface LatencyData {
  ts: string;
  p50: string;
  p90: string;
  p99: string;
}

interface Props {
  originUrl: string;
  resourceUrl: string;
}

const LATENCY_ENDPOINT = '/api/observability/latency';

export const LatencyChart: React.FC<Props> = ({ originUrl, resourceUrl }) => {
  const { data, isLoading } = useObservabilityData<LatencyData>({
    endpoint: LATENCY_ENDPOINT,
    originUrl,
    resourceUrl,
  });

  if (isLoading) {
    return (
      <LoadingChart
        legendItems={[{ label: 'p50' }, { label: 'p90' }, { label: 'p99' }]}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No latency data available
      </div>
    );
  }

  const chartData: ChartData<{
    p50: number;
    p90: number;
    p99: number;
  }>[] = data.map(item => {
    const date = new Date(item.ts);
    const formatted = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      timestamp: formatted,
      p50: parseFloat(item.p50) / 1000, // Convert to seconds
      p90: parseFloat(item.p90) / 1000,
      p99: parseFloat(item.p99) / 1000,
    };
  });

  return (
    <Card className="w-full lg:w-1/3">
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Latency</CardTitle>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-xs">p50</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <span className="text-xs">p90</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
              <span className="text-xs">p99</span>
            </div>
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
            domain: [0, (dataMax: number) => Math.ceil(dataMax * 1.1)],
            hide: true,
          },
        ]}
        tooltipRows={[
          {
            key: 'p50',
            label: 'p50',
            getValue: data => `${data.toFixed(3)}s`,
            dotColor: '#10b981',
          },
          {
            key: 'p90',
            label: 'p90',
            getValue: data => `${data.toFixed(3)}s`,
            dotColor: '#f59e0b',
          },
          {
            key: 'p99',
            label: 'p99',
            getValue: data => `${data.toFixed(3)}s`,
            dotColor: '#ef4444',
          },
        ]}
        xAxis={{
          show: false,
          height: 0,
        }}
      >
        <Line
          type="linear"
          dataKey="p50"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          yAxisId={0}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="p90"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          yAxisId={0}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="p99"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          yAxisId={0}
          isAnimationActive={false}
        />
      </BaseChart>
    </Card>
  );
};
