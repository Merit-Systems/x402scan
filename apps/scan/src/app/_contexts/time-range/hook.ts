'use client';

import { useContext, useMemo } from 'react';
import { subMinutes } from 'date-fns';

import { TimeRangeContext } from './context';
import { CACHE_DURATION_MINUTES } from '@/lib/cache-constants';

/**
 * Hook to access the time range context with automatic cache lag applied.
 *
 * Applies a CACHE_DURATION_MINUTES lag to startDate and endDate to ensure
 * queries always hit pre-warmed caches. This allows the cache warming cron
 * (which runs every 5 minutes) to always be ahead of user queries.
 *
 * Example timeline:
 * - 11:55 - Cron warms cache for endDate=11:55
 * - 12:00 - Cron warms cache for endDate=12:00
 * - 12:03 - User queries with endDate=11:58 (12:03 - 5min) → Cache hit on 11:55 bucket
 * - 12:08 - User queries with endDate=12:03 (12:08 - 5min) → Cache hit on 12:00 bucket
 */
export const useTimeRangeContext = () => {
  const context = useContext(TimeRangeContext);

  // Apply CACHE_DURATION_MINUTES lag to ensure we query data that's already cached
  // The UI still shows current dates, but queries use lagged dates transparently
  return useMemo(
    () => ({
      ...context,
      startDate: subMinutes(context.startDate, CACHE_DURATION_MINUTES),
      endDate: subMinutes(context.endDate, CACHE_DURATION_MINUTES),
    }),
    [context.startDate, context.endDate]
  );
};
