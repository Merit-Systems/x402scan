"use client";

import { useCallback, useMemo, useState } from "react";

import { TimeRangeContext } from "./context";

import type { ActivityTimeframe } from "@/types/timeframes";

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

  const selectTimeframe = useCallback((newTimeframe: ActivityTimeframe) => {
    setTimeframe(newTimeframe);
  }, []);
  const contextValue = useMemo(
    () => ({ timeframe, selectTimeframe }),
    [timeframe, selectTimeframe]
  );

  return (
    <TimeRangeContext.Provider value={contextValue}>
      {children}
    </TimeRangeContext.Provider>
  );
};
