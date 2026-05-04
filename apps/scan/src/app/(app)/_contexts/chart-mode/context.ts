'use client';

import { createContext } from 'react';

export type ChartMode = 'bucketed' | 'cumulative';

interface ChartModeContextType {
  chartMode: ChartMode;
  selectChartMode: (mode: ChartMode) => void;
}

export const ChartModeContext = createContext<ChartModeContextType>({
  chartMode: 'bucketed',
  selectChartMode: () => {
    void 0;
  },
});
