'use client';

import { useState } from 'react';

import { TimeRangeContext } from './context';

import type { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  children: React.ReactNode;
  initialTimeframe: ActivityTimeframe;
}

export const TimeRangeProvider: React.FC<Props> = ({
  children,
  initialTimeframe,
}) => {
  const [timeframe, setTimeframe] =
    useState<ActivityTimeframe>(initialTimeframe);

  const selectTimeframe = (newTimeframe: ActivityTimeframe) => {
    setTimeframe(newTimeframe);
  };

  return (
    <TimeRangeContext.Provider
      value={{
        timeframe,
        selectTimeframe,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
};
