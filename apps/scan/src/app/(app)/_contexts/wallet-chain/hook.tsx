'use client';

import { useContext } from 'react';
import { WalletChainContext } from './context';

export const useWalletChain = () => {
  const context = useContext(WalletChainContext);
  if (!context) {
    throw new Error('useWalletChain must be used within a WalletChainProvider');
  }
  return context;
};
