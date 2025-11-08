import { subHours } from 'date-fns';

import type z from 'zod';
import type { timeframeSchema, timePeriodSchema } from './schemas';
import { ActivityTimeframe } from '@/types/timeframes';

// x402 launch date (beginning of 2025)
const X402_LAUNCH_DATE = new Date('2025-01-01T00:00:00Z');

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

  // Special case: AllTime means since x402 launch
  const period = typeof timeframe === 'number' ? timeframe : timeframe.period;
  if (period === ActivityTimeframe.AllTime || period >= 999999) {
    return { startDate: X402_LAUNCH_DATE, endDate };
  }

  // For all other timeframes, calculate from endDate
  // Using hours instead of days because of daylight savings.
  // Sanity check: don't go back more than 5 years
  const maxDays = 365 * 5;
  const safePeriod = Math.min(period, maxDays);
  const startDate = subHours(endDate, safePeriod * 24);

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

  // Special case: AllTime means since first transfer
  if (period === ActivityTimeframe.AllTime || period >= 999999) {
    return {
      startDate:
        typeof creationDate === 'function'
          ? await creationDate()
          : creationDate,
      endDate,
    };
  }

  // Sanity check: don't go back more than 5 years
  const maxDays = 365 * 5;
  const safePeriod = Math.min(period, maxDays);
  const startDate = subHours(endDate, safePeriod * 24);

  return { startDate, endDate };
};
