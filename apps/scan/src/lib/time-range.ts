import { subHours } from 'date-fns';

import type z from 'zod';
import type { timeframeSchema, timePeriodSchema } from './schemas';
import { ActivityTimeframe } from '@/types/timeframes';

export function getTimeRangeFromTimeframe(
  timeframe: z.infer<typeof timeframeSchema>
) {
  const now = new Date();

  const period = typeof timeframe === 'number' ? timeframe : timeframe.period;
  if (period === 0) {
    // Use a floor date instead of null so TimescaleDB can still do
    // chunk exclusion and Prisma always emits a block_timestamp filter.
    // All TransferEvent data starts 2025-05-09; this won't exclude anything.
    return { startDate: new Date('2024-01-01T00:00:00Z'), endDate: now };
  }

  const endDate =
    typeof timeframe === 'number' || !timeframe.offset
      ? now
      : subHours(now, timeframe.offset * 24);

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

  // Handle All Time (0) and ThirtyDays - use creation date as start
  if (
    period === Number(ActivityTimeframe.AllTime) ||
    period === Number(ActivityTimeframe.ThirtyDays)
  ) {
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
  timeframe:
    | number
    | {
        period: number;
        offset?: number | undefined;
      }
): string {
  if (typeof timeframe === 'number') {
    return `${timeframe}d`;
  }
  return `${timeframe.period}d`;
}
