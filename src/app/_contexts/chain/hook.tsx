'use client';

import { useContext } from 'react';
import { ChainContext } from './context';

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};
