import { useEffect, useState } from 'react';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { differenceInDays } from 'date-fns';

interface UseObservabilityDataOptions {
  endpoint: string;
  originUrl: string;
  resourceUrl?: string;
}

export function useObservabilityData<T>(options: UseObservabilityDataOptions) {
  const { endpoint, originUrl, resourceUrl } = options;
  const { startDate, endDate } = useTimeRangeContext();
  const [data, setData] = useState<T[]>([]);
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
