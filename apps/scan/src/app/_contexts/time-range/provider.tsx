'use client';

import { useState } from 'react';

import { subDays } from 'date-fns';

import { TimeRangeContext } from './context';

import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  children: React.ReactNode;
  initialTimeframe?: ActivityTimeframe;
  initialEndDate?: Date;
  initialStartDate?: Date;
  creationDate: Date;
}

export const TimeRangeProvider = ({
  children,
  initialTimeframe,
  initialStartDate,
  initialEndDate,
  creationDate,
}: Props) => {
  const [timeframe, setTimeframe] = useState<ActivityTimeframe>(
    initialTimeframe ?? ActivityTimeframe.AllTime
  );
  const [endDate, setEndDate] = useState<Date>(initialEndDate ?? new Date());
  const [startDate, setStartDate] = useState<Date>(
    initialStartDate ?? creationDate
  );

  const selectTimeframe = (timeframe: ActivityTimeframe) => {
    if (timeframe === ActivityTimeframe.AllTime) {
      setStartDate(creationDate);
    } else {
      setStartDate(subDays(new Date(), timeframe));
    }
    setEndDate(new Date());
    setTimeframe(timeframe);
  };

  const setCustomTimeframe = (startDate: Date, endDate: Date) => {
    setStartDate(startDate);
    setEndDate(endDate);
    setTimeframe(ActivityTimeframe.Custom);
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
