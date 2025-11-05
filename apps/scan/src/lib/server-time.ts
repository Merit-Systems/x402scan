import type { ActivityTimeframe } from '@/types/timeframes';
import { getTimeRangeFromTimeframe } from './time-range';

/**
 * Get the server-side time range for SSR prefetching.
 *
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
