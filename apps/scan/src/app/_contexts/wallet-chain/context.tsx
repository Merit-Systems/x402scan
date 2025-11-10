'use client';

import { createContext } from 'react';

import type { Chain } from '@/types/chain';

interface WalletChainContextType {
  chain: Chain;
  setChain: (chain: Chain) => void;
  isFixed: boolean;
}

export const WalletChainContext = createContext<
  WalletChainContextType | undefined
>(undefined);
