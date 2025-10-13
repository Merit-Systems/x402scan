'use client';

import { createContext } from 'react';

import { ActivityTimeframe } from '@/types/timeframes';

interface TimeRangeContextType {
  startDate: Date;
  endDate: Date;
  timeframe: ActivityTimeframe;
  selectTimeframe: (timeframe: ActivityTimeframe) => void;
  setCustomTimeframe: (startDate: Date, endDate: Date) => void;
}

export const TimeRangeContext = createContext<TimeRangeContextType>({
  startDate: new Date(),
  endDate: new Date(),
  timeframe: ActivityTimeframe.SevenDays,
  selectTimeframe: () => {
    void 0;
  },
  setCustomTimeframe: () => {
    void 0;
  },
});
