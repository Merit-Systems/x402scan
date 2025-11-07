'use client';

import { useState } from 'react';
import { WalletChainContext } from './context';

import { Chain } from '@/types/chain';

import type { ConnectedWallets } from '@/app/_hooks/use-connected-wallets';

interface Props {
  children: React.ReactNode;
  connectedWallets?: ConnectedWallets;
  initialChain?: Chain;
  isFixed?: boolean;
}

export const WalletChainProvider: React.FC<Props> = ({
  children,
  connectedWallets,
  initialChain,
  isFixed = false,
}) => {
  const [chain, setChainState] = useState<Chain>(
    initialChain ??
      (!connectedWallets || connectedWallets.evmAddress
        ? Chain.BASE
        : Chain.SOLANA)
  );

  const setChain = (chain: Chain) => {
    setChainState(chain);
  };

  return (
    <WalletChainContext.Provider value={{ chain, setChain, isFixed }}>
      {children}
    </WalletChainContext.Provider>
  );
};
