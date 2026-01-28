import { useMemo } from 'react';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { subDays } from 'date-fns';

export function useObservabilityDataParams() {
  const { timeframe } = useTimeRangeContext();

  return useMemo(() => {
    const now = new Date();
    const start = subDays(now, Number(timeframe));

    let minutes = 10;
    const days = Number(timeframe);
    if (days >= 15) {
      minutes = 60; // 1 hour buckets for 15+ days
    } else if (days >= 7) {
      minutes = 30; // 30 min buckets for 7+ days
    } else if (days >= 3) {
      minutes = 15; // 15 min buckets for 3+ days
    }

    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      bucketMinutes: minutes,
    };
  }, [timeframe]);
}
