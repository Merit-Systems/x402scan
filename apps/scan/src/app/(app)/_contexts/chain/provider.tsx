'use client';

import { useEffect, useState } from 'react';
import { ChainContext } from './context';

import type { Chain } from '@/types/chain';
import { useSearchParams } from 'next/navigation';
import { parseChain } from '@/app/(app)/_lib/chain/parse';
import {
  getDataChainCookieClient,
  setDataChainCookieClient,
} from './cookies/client';

interface Props {
  children: React.ReactNode;
}

export const ChainProvider: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();
  const [chain, setChainState] = useState<Chain | undefined>(
    parseChain(searchParams.get('chain')) ?? getDataChainCookieClient()
  );

  useEffect(() => {
    setDataChainCookieClient(chain);
  }, [chain]);

  const setChain = (chain: Chain | undefined) => {
    setChainState(chain);
  };

  return (
    <ChainContext.Provider value={{ chain, setChain }}>
      {children}
    </ChainContext.Provider>
  );
};
