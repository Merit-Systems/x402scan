'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { StatusChart } from './status-chart';
import { differenceInDays } from 'date-fns';
import { BaseChart } from '@/components/ui/charts/chart/chart';
import { Area } from 'recharts';
import { simulateChartData } from '@/components/ui/charts/chart/simulate';

interface StatusCodeData {
  ts: string;
  r_2xx: string;
  r_3xx: string;
  r_4xx: string;
  r_5xx: string;
}

interface Props {
  originUrl: string;
}

const LoadingStatusChart = () => {
  const simulatedData = useMemo(() => simulateChartData({ days: 48 }), []);

  return (
    <div className="w-1/2 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold"></h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs text-muted-foreground">2XX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs text-muted-foreground">3XX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs text-muted-foreground">4XX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs text-muted-foreground">5XX</span>
          </div>
        </div>
      </div>
      <BaseChart
        type="composed"
        data={simulatedData}
        height={200}
        margin={{ top: 0, right: 0, left: 0, bottom: 20 }}
        yAxes={[
          {
            domain: [0, 'dataMax'],
            hide: false,
          },
        ]}
        xAxis={{
          show: false,
          height: 0,
        }}
      >
        <Area
          type="monotone"
          dataKey="value"
          stroke="color-mix(in oklab, var(--color-neutral-500) 20%, transparent)"
          fill="color-mix(in oklab, var(--color-neutral-500) 20%, transparent)"
          strokeWidth={2}
          yAxisId={0}
          isAnimationActive={false}
        />
      </BaseChart>
    </div>
  );
};

export const StatusChartWrapper: React.FC<Props> = ({ originUrl }) => {
  const { startDate, endDate } = useTimeRangeContext();
  const [data, setData] = useState<StatusCodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Calculate bucket size based on range
        const daysDiff = differenceInDays(endDate, startDate);
        let bucketMinutes = 10;
        if (daysDiff >= 15) {
          bucketMinutes = 60; // 1 hour buckets for 15+ days
        } else if (daysDiff >= 7) {
          bucketMinutes = 30; // 30 min buckets for 7+ days
        } else if (daysDiff >= 3) {
          bucketMinutes = 15; // 15 min buckets for 3+ days
        }

        const response = await fetch('/api/observability/status-codes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originUrl,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            bucketMinutes,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch observability data');
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching observability data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, originUrl]);

  if (isLoading) {
    return <LoadingStatusChart />;
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No observability data available
      </div>
    );
  }

  return <StatusChart data={data} />;
};
