import { useEffect, useState, useMemo } from 'react';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { subDays } from 'date-fns';

interface UseObservabilityDataOptions {
  endpoint: string;
  originUrl: string;
  resourceUrl?: string;
}

export function useObservabilityData<T>(options: UseObservabilityDataOptions) {
  const { endpoint, originUrl, resourceUrl } = options;
  const { timeframe } = useTimeRangeContext();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { startDate, endDate, bucketMinutes } = useMemo(() => {
    const now = new Date();
    const start = subDays(now, timeframe);

    let minutes = 10;
    if (timeframe >= 15) {
      minutes = 60; // 1 hour buckets for 15+ days
    } else if (timeframe >= 7) {
      minutes = 30; // 30 min buckets for 7+ days
    } else if (timeframe >= 3) {
      minutes = 15; // 15 min buckets for 3+ days
    }

    return {
      startDate: start,
      endDate: now,
      bucketMinutes: minutes,
    };
  }, [timeframe]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originUrl,
            resourceUrl,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            bucketMinutes,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${endpoint}`);
        }

        const result = (await response.json()) as T[];
        setData(result);
      } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [startDate, endDate, originUrl, resourceUrl, endpoint]);

  return { data, isLoading };
}
