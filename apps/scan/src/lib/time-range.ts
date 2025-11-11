import { ActivityTimeframe } from '@/types/timeframes';

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
