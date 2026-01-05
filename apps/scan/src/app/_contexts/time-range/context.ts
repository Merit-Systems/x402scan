'use client';

import { createContext } from 'react';

import { ActivityTimeframe } from '@/types/timeframes';

type TimeRangeContextType = {
  timeframe: ActivityTimeframe;
  selectTimeframe: (timeframe: ActivityTimeframe) => void;
};

export const TimeRangeContext = createContext<TimeRangeContextType>({
  timeframe: ActivityTimeframe.OneDay,
  selectTimeframe: () => {
    void 0;
  },
});
