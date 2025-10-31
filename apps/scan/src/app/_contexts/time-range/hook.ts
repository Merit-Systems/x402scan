'use client';

import { useContext } from 'react';

import { TimeRangeContext } from './context';

export const useTimeRangeContext = () => {
  return useContext(TimeRangeContext);
};
