import { subDays, subMinutes } from 'date-fns';
import { CACHE_DURATION_MINUTES } from './cache-constants';
import { ActivityTimeframe } from '@/types/timeframes';

/**
 * Calculate time range from an ActivityTimeframe with cache lag applied.
 *
 * This is the single source of truth for converting a timeframe enum into
 * actual start/end dates with the appropriate cache lag for hitting pre-warmed caches.
 *
 * Used by both server-side (getSSRTimeRange) and client-side (TimeRangeProvider).
 *
 * @param timeframe - The activity timeframe to calculate dates for
 * @param creationDate - The earliest possible date (for AllTime timeframe)
 * @returns Object with startDate and endDate, both lagged by CACHE_DURATION_MINUTES
 *
 * @example
 * ```ts
 * const { startDate, endDate } = getTimeRangeFromTimeframe(
 *   ActivityTimeframe.OneDay,
 *   firstTransfer
 * );
 * // startDate: now - 15min - 1day
 * // endDate: now - 15min
 * ```
 */
export function getTimeRangeFromTimeframe(
  timeframe: ActivityTimeframe,
  creationDate: Date
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = subMinutes(now, CACHE_DURATION_MINUTES);

  if (timeframe === ActivityTimeframe.AllTime) {
    // For AllTime, start from creation date (also lagged)
    return {
      startDate: subMinutes(creationDate, CACHE_DURATION_MINUTES),
      endDate,
    };
  }

  if (timeframe === ActivityTimeframe.Custom) {
    // Custom ranges should not call this function
    // They're handled separately in TimeRangeProvider
    throw new Error(
      'getTimeRangeFromTimeframe cannot be used with Custom timeframe'
    );
  }

  // For all other timeframes, calculate from endDate
  const startDate = subDays(endDate, timeframe);

  return { startDate, endDate };
}
