'use client';

import { useState } from 'react';

import { ChartModeContext, type ChartMode } from './context';

interface Props {
  children: React.ReactNode;
  initialMode?: ChartMode;
}

export const ChartModeProvider: React.FC<Props> = ({
  children,
  initialMode = 'bucketed',
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>(initialMode);

  return (
    <ChartModeContext.Provider
      value={{
        chartMode,
        selectChartMode: setChartMode,
      }}
    >
      {children}
    </ChartModeContext.Provider>
  );
};
