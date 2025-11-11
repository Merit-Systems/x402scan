'use client';

import { useEffect, useState } from 'react';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { StatusChart } from './status-chart';
import { differenceInDays } from 'date-fns';

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
    return (
      <div className="text-center text-muted-foreground py-8">
        Loading observability data...
      </div>
    );
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
