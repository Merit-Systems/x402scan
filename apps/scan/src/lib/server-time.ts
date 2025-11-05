import { subMinutes } from 'date-fns';
import { CACHE_DURATION_MINUTES } from './cache-constants';

/**
 * Get the server-side range end time with cache lag applied.
 *
 * This ensures server-side prefetch queries use the same lagged time as client queries
 * (via useTimeRangeContext), guaranteeing cache hits on the pre-warmed cache buckets.
 *
 * Returns both the raw current time (for TimeRangeProvider) and the lagged time (for queries).
 *
 * @returns Object with rawEndDate (current time) and endDate (lagged by CACHE_DURATION_MINUTES)
 *
 * @example
 * ```ts
 * const { rawEndDate, endDate } = getSSRRangeEndTime();
 * const startDate = subDays(endDate, 1);
 *
 * // Use lagged times for prefetch
 * await api.query.prefetch({ startDate, endDate });
 *
 * // Use raw time for TimeRangeProvider
 * <TimeRangeProvider initialEndDate={rawEndDate} initialStartDate={subDays(rawEndDate, 1)} />
 * ```
 */
export function getSSRRangeEndTime() {
  const rawEndDate = new Date();
  const endDate = subMinutes(rawEndDate, CACHE_DURATION_MINUTES);
  return { rawEndDate, endDate };
}
