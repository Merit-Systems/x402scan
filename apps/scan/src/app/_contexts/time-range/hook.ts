'use client';

import { useContext } from 'react';

import { TimeRangeContext } from './context';

/**
 * Hook to access the time range context.
 *
 * Returns dates that already have cache lag applied by the TimeRangeProvider.
 * No additional transformation needed - dates are ready to use in queries.
 *
 * @returns TimeRangeContext with startDate, endDate (already lagged), timeframe, and actions
 */
export const useTimeRangeContext = () => {
  return useContext(TimeRangeContext);
};
