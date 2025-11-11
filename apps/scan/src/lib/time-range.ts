import { ActivityTimeframe } from '@/types/timeframes';
import { subHours } from 'date-fns';

import type z from 'zod';
import type { timeframeSchema, timePeriodSchema } from './schemas';

export function getTimeRangeFromTimeframe(
  timeframe: z.infer<typeof timeframeSchema>
) {
  const now = new Date();
  const endDate =
    typeof timeframe === 'number' || !timeframe.offset
      ? now
      : subHours(now, timeframe.offset * 24);
  if (timeframe === 0) {
        return { startDate: undefined, endDate };
  }
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

  if (period === 0) {
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

export function getMaterializedViewSuffix(
  timeframe: ActivityTimeframe
): string {
  switch (timeframe) {
    case ActivityTimeframe.OneDay:
      return '1d';
    case ActivityTimeframe.SevenDays:
      return '7d';
    case ActivityTimeframe.FourteenDays:
      return '14d';
    case ActivityTimeframe.ThirtyDays:
      return '30d';
    default:
      return '1d';
  }
}
