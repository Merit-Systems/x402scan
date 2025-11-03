'use client';

import { useState } from 'react';
import { WalletChainContext } from './context';

import { Chain } from '@/types/chain';
import { useSearchParams } from 'next/navigation';
import { getChain } from '@/app/_lib/chain';
import { ConnectedWallets } from '@/app/_hooks/use-connected-wallets';

interface Props {
  children: React.ReactNode;
  connectedWallets: ConnectedWallets;
}

export const WalletChainProvider: React.FC<Props> = ({
  children,
  connectedWallets,
}) => {
  const [chain, setChainState] = useState<Chain>(
    connectedWallets.evmAddress ? Chain.BASE : Chain.SOLANA
  );

  const setChain = (chain: Chain) => {
    setChainState(chain);
  };

  return (
    <WalletChainContext.Provider value={{ chain, setChain }}>
      {children}
    </WalletChainContext.Provider>
  );
};
