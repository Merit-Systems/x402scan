'use client';

import { BaseChart } from '@/components/ui/charts/chart/chart';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Area } from 'recharts';
import { LoadingChart } from './loading-chart';
import { useObservabilityData } from './use-observability-data';

interface StatusCodeData {
  ts: string;
  r_2xx: string;
  r_3xx: string;
  r_4xx: string;
  r_5xx: string;
}

interface Props {
  originUrl: string;
  resourceUrl?: string;
}

export const StatusChart: React.FC<Props> = ({ originUrl, resourceUrl }) => {
  const { data, isLoading } = useObservabilityData<StatusCodeData>({
    endpoint: '/api/observability/status-codes',
    originUrl,
    resourceUrl,
  });

  if (isLoading) {
    return (
      <LoadingChart
        legendItems={[
          { label: '2XX' },
          { label: '3XX' },
          { label: '4XX' },
          { label: '5XX' },
        ]}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No observability data available
      </div>
    );
  }

  return <StatusChartInner data={data} />;
};

const StatusChartInner: React.FC<{ data: StatusCodeData[] }> = ({ data }) => {
  // Transform the data to the format expected by the chart
  const chartData: ChartData<{
    success: number;
    redirect: number;
    clientError: number;
    serverError: number;
  }>[] = data.map(item => {
    const date = new Date(item.ts);
    // Format as "Nov 5, 2:40 AM"
    const formatted = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      timestamp: formatted,
      success: parseInt(item.r_2xx),
      redirect: parseInt(item.r_3xx),
      clientError: parseInt(item.r_4xx),
      serverError: parseInt(item.r_5xx),
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
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="text-xs">2XX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
            <span className="text-xs">3XX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-xs">4XX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-xs">5XX</span>
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
            domain: [0, (dataMax: number) => Math.ceil(dataMax * 1.1)],
            hide: false,
          },
        ]}
        tooltipRows={[
          {
            key: 'success',
            label: '2xx Success',
            getValue: data => data.toString(),
            dotColor: '#3b82f6',
          },
          {
            key: 'redirect',
            label: '3xx Redirect',
            getValue: data => data.toString(),
            dotColor: '#6366f1',
          },
          {
            key: 'clientError',
            label: '4xx Client Error',
            getValue: data => data.toString(),
            dotColor: '#f59e0b',
          },
          {
            key: 'serverError',
            label: '5xx Server Error',
            getValue: data => data.toString(),
            dotColor: '#ef4444',
          },
        ]}
        xAxis={{
          show: false,
          height: 0,
        }}
      >
        <defs>
          <linearGradient id="success-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="redirect-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="clientError-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="serverError-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="success"
          stroke="#3b82f6"
          fill="url(#success-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
        <Area
          type="monotone"
          dataKey="redirect"
          stroke="#6366f1"
          fill="url(#redirect-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
        <Area
          type="monotone"
          dataKey="clientError"
          stroke="#f59e0b"
          fill="url(#clientError-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
        <Area
          type="monotone"
          dataKey="serverError"
          stroke="#ef4444"
          fill="url(#serverError-gradient)"
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
