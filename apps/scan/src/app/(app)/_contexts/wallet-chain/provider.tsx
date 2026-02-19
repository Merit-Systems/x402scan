'use client';

import { useState } from 'react';
import { WalletChainContext } from './context';

import { Chain } from '@/types/chain';

import type { ConnectedWallets } from '@/app/(app)/_hooks/use-connected-wallets';
import type { SupportedChain } from '@/types/chain';

interface Props {
  children: React.ReactNode;
  connectedWallets?: ConnectedWallets;
  initialChain?: SupportedChain;
  isFixed?: boolean;
}

export const WalletChainProvider: React.FC<Props> = ({
  children,
  connectedWallets,
  initialChain,
  isFixed = false,
}) => {
  const [chain, setChainState] = useState<SupportedChain>(
    initialChain ??
      (!connectedWallets || connectedWallets.evmAddress
        ? Chain.BASE
        : Chain.SOLANA)
  );

  const setChain = (chain: SupportedChain) => {
    setChainState(chain);
  };

  return (
    <WalletChainContext.Provider value={{ chain, setChain, isFixed }}>
      {children}
    </WalletChainContext.Provider>
  );
};
