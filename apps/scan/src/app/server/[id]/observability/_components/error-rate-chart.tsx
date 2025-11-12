'use client';

import { BaseChart } from '@/components/ui/charts/chart/chart';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Area } from 'recharts';

interface ErrorRateData {
  ts: string;
  total_requests: string;
  error_requests: string;
  error_rate: string;
}

interface Props {
  data: ErrorRateData[];
}

export const ErrorRateChart: React.FC<Props> = ({ data }) => {
  // Transform the data to the format expected by the chart
  const chartData: ChartData<{
    errorRate: number;
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
      errorRate: parseFloat(item.error_rate),
    };
  });

  // Get start and end timestamps for display
  const startTime = chartData.length > 0 ? chartData[0].timestamp : '';
  const endTime =
    chartData.length > 0 ? chartData[chartData.length - 1].timestamp : '';

  return (
    <div className="w-1/2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold"></h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-xs">Server Error Rate</span>
          </div>
        </div>
      </div>
      <BaseChart
        type="composed"
        data={chartData}
        height={200}
        margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
        yAxes={[
          {
            domain: [0, 100],
            hide: false,
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
      <div className="flex justify-between text-xs text-muted-foreground px-2 mt-1">
        <span>{startTime}</span>
        <span>{endTime}</span>
      </div>
    </div>
  );
};
