'use client';

import { createContext } from 'react';

import type { SupportedChain } from '@/types/chain';

type WalletChainContextType = {
  chain: SupportedChain;
  setChain: (chain: SupportedChain) => void;
  isFixed: boolean;
};

export const WalletChainContext = createContext<
  WalletChainContextType | undefined
>(undefined);
