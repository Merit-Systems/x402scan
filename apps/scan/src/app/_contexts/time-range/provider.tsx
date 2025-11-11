'use client';

import { useState, useMemo } from 'react';
import { subMinutes } from 'date-fns';

import { TimeRangeContext } from './context';
import { ActivityTimeframe } from '@/types/timeframes';
import { getTimeRangeFromTimeframe } from '@/lib/time-range';
import { CACHE_DURATION_MINUTES } from '@/lib/cache-constants';

interface Props {
  children: React.ReactNode;
  initialTimeframe: ActivityTimeframe;
  creationDate: Date;
}

export const TimeRangeProvider = ({
  children,
  initialTimeframe,
  creationDate,
}: Props) => {
  const [timeframe, setTimeframe] =
    useState<ActivityTimeframe>(initialTimeframe);
  const [customRange, setCustomRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // Compute dates from timeframe (with cache lag built in)
  // or use custom range (also with cache lag)
  const { startDate, endDate } = useMemo((): {
    startDate: Date;
    endDate: Date;
  } => {
    if (timeframe === ActivityTimeframe.Custom && customRange) {
      // Apply cache lag to custom dates
      return {
        startDate: subMinutes(customRange.start, CACHE_DURATION_MINUTES),
        endDate: subMinutes(customRange.end, CACHE_DURATION_MINUTES),
      };
    }

    // Use shared helper for standard timeframes
    return getTimeRangeFromTimeframe(timeframe, creationDate);
  }, [timeframe, customRange, creationDate]);

  const selectTimeframe = (newTimeframe: ActivityTimeframe) => {
    setTimeframe(newTimeframe);
    setCustomRange(null); // Clear custom range when switching to preset
  };

  const setCustomTimeframe = (start: Date, end: Date) => {
    setTimeframe(ActivityTimeframe.Custom);
    setCustomRange({ start, end });
  };

  return (
    <TimeRangeContext.Provider
      value={{
        startDate,
        endDate,
        timeframe,
        selectTimeframe,
        setCustomTimeframe,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
};
