'use client';

import type { Chain } from '@/types/chain';
import { createContext } from 'react';

interface ChainContextType {
  chain: Chain | undefined;
  setChain: (chain: Chain | undefined) => void;
}

export const ChainContext = createContext<ChainContextType>({
  chain: undefined,
  setChain: () => {
    void 0;
  },
});
