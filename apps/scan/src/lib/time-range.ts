import { subHours } from 'date-fns';

import type z from 'zod';
import type { timeframeSchema, timePeriodSchema } from './schemas';
import { ActivityTimeframe } from '@/types/timeframes';

export function getTimeRangeFromTimeframe(
  timeframe: z.infer<typeof timeframeSchema>
) {
  const now = new Date();
  const endDate =
    typeof timeframe === 'number' || !timeframe.offset
      ? now
      : subHours(now, timeframe.offset * 24);

  if (timeframe === Number(ActivityTimeframe.AllTime)) {
    return { startDate: undefined, endDate };
  }

  // For all other timeframes, calculate from endDate
  // Using hours instead of days because of daylight savings.
  const startDate =
    typeof timeframe === 'number'
      ? subHours(endDate, timeframe * 24)
      : subHours(endDate, timeframe.period * 24);

  return { startDate, endDate };
}

interface BucketedTimeframeProps {
  period: z.infer<typeof timePeriodSchema>;
  creationDate: Date | (() => Promise<Date>);
}

export const getBucketedTimeRangeFromTimeframe = async ({
  period,
  creationDate,
}: BucketedTimeframeProps) => {
  const now = new Date();
  const endDate = now;

  if (period === Number(ActivityTimeframe.AllTime)) {
    return {
      startDate:
        typeof creationDate === 'function'
          ? await creationDate()
          : creationDate,
      endDate,
    };
  }

  const startDate = subHours(endDate, period * 24);

  return { startDate, endDate };
};
