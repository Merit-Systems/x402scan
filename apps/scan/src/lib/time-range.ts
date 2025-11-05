import { subDays, subMinutes } from 'date-fns';
import { CACHE_DURATION_MINUTES } from './cache-constants';
import { ActivityTimeframe } from '@/types/timeframes';

/**
 * Calculate time range from an ActivityTimeframe with cache lag applied.
 *
 * This is the single source of truth for converting a timeframe enum into
 * actual start/end dates with the appropriate cache lag for hitting pre-warmed caches.
 *
 * Used by both server-side (for SSR prefetching) and client-side (TimeRangeProvider).
 *
 * @param timeframe - The activity timeframe to calculate dates for
 * @param creationDate - The earliest possible date (for AllTime timeframe)
 * @returns Object with startDate and endDate, both lagged by CACHE_DURATION_MINUTES
 *
 * @example
 * ```ts
 * // Server-side usage (SSR prefetching)
 * const { startDate, endDate } = getTimeRangeFromTimeframe(
 *   ActivityTimeframe.OneDay,
 *   firstTransfer
 * );
 * await api.query.prefetch({ startDate, endDate });
 *
 * // Client-side usage (in TimeRangeProvider)
 * const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe, creationDate);
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

/**
 * Get the server-side time range for SSR prefetching.
 *
 * Alias for getTimeRangeFromTimeframe() - provided for semantic clarity in server components.
 * Returns dates with cache lag applied to ensure server prefetch queries
 * use the same lagged times that clients will query, guaranteeing cache hits.
 *
 * @param timeframe - The activity timeframe (e.g., ActivityTimeframe.OneDay)
 * @param creationDate - Required for AllTime timeframe, earliest possible date
 * @returns Object with startDate and endDate (both lagged for cache alignment)
 *
 * @example
 * ```ts
 * // 1-day range
 * const { startDate, endDate } = getSSRTimeRange(ActivityTimeframe.OneDay, firstTransfer);
 * await api.query.prefetch({ startDate, endDate });
 *
 * // 7-day range
 * const { startDate, endDate } = getSSRTimeRange(ActivityTimeframe.SevenDays, firstTransfer);
 *
 * // All-time range
 * const { startDate, endDate } = getSSRTimeRange(ActivityTimeframe.AllTime, firstTransfer);
 * ```
 */
export function getSSRTimeRange(
  timeframe: ActivityTimeframe,
  creationDate: Date
): { startDate: Date; endDate: Date } {
  return getTimeRangeFromTimeframe(timeframe, creationDate);
}
