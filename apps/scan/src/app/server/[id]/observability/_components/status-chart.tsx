'use client';

import { BaseChart } from '@/components/ui/charts/chart/chart';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Area } from 'recharts';

interface StatusCodeData {
  ts: string;
  r_2xx: string;
  r_3xx: string;
  r_4xx: string;
  r_5xx: string;
}

interface Props {
  data: StatusCodeData[];
}

export const StatusChart: React.FC<Props> = ({ data }) => {
  // Transform the data to the format expected by the chart
  const chartData: ChartData<{
    success: number;
    redirect: number;
    clientError: number;
    serverError: number;
  }>[] = data.map(item => ({
    timestamp: new Date(item.ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    success: parseInt(item.r_2xx),
    redirect: parseInt(item.r_3xx),
    clientError: parseInt(item.r_4xx),
    serverError: parseInt(item.r_5xx),
  }));

  return (
    <div className="w-full">
      <BaseChart
        type="composed"
        data={chartData}
        height={400}
        yAxes={[
          {
            domain: [0, 'dataMax'],
            hide: false,
          },
        ]}
        tooltipRows={[
          {
            key: 'success',
            label: '2xx Success',
            getValue: data => data.toString(),
            dotColor: 'hsl(142, 76%, 36%)',
          },
          {
            key: 'redirect',
            label: '3xx Redirect',
            getValue: data => data.toString(),
            dotColor: 'hsl(48, 96%, 53%)',
          },
          {
            key: 'clientError',
            label: '4xx Client Error',
            getValue: data => data.toString(),
            dotColor: 'hsl(25, 95%, 53%)',
          },
          {
            key: 'serverError',
            label: '5xx Server Error',
            getValue: data => data.toString(),
            dotColor: 'hsl(0, 84%, 60%)',
          },
        ]}
        xAxis={{
          show: true,
          angle: -45,
          height: 60,
        }}
      >
        <defs>
          <linearGradient id="success-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(142, 76%, 36%)"
              stopOpacity={0.4}
            />
            <stop
              offset="100%"
              stopColor="hsl(142, 76%, 36%)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="redirect-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(48, 96%, 53%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(48, 96%, 53%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="clientError-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="serverError-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="success"
          stroke="hsl(142, 76%, 36%)"
          fill="url(#success-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
        <Area
          type="monotone"
          dataKey="redirect"
          stroke="hsl(48, 96%, 53%)"
          fill="url(#redirect-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
        <Area
          type="monotone"
          dataKey="clientError"
          stroke="hsl(25, 95%, 53%)"
          fill="url(#clientError-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
        <Area
          type="monotone"
          dataKey="serverError"
          stroke="hsl(0, 84%, 60%)"
          fill="url(#serverError-gradient)"
          strokeWidth={2}
          yAxisId={0}
        />
      </BaseChart>
      <div className="mt-4 flex gap-4 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)]" />
          <span className="text-sm">2xx Success</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(48,96%,53%)]" />
          <span className="text-sm">3xx Redirect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(25,95%,53%)]" />
          <span className="text-sm">4xx Client Error</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
          <span className="text-sm">5xx Server Error</span>
        </div>
      </div>
    </div>
  );
};
