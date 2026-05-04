'use client';

import { useContext } from 'react';

import { ChartModeContext } from './context';

export const useChartMode = () => {
  return useContext(ChartModeContext);
};
