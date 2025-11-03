'use client';

import { useEffect, useState } from 'react';

import { useCdpSolanaStandardWallet } from '@coinbase/cdp-solana-standard-wallet';

import { SolanaWalletContext } from './context';

import type { ReactNode } from 'react';
import type { ConnectedSolanaWallet } from './context';

interface Props {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: Props) {
  const { ready, wallet } = useCdpSolanaStandardWallet();

  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedSolanaWallet | null>(null);

  const disconnect = () => {
    setConnectedWallet(null);
  };

  useEffect(() => {
    if (ready && wallet) {
      setConnectedWallet({
        account: wallet.accounts[0],
        wallet: wallet,
      });
    }
  }, [ready, wallet]);

  return (
    <SolanaWalletContext.Provider
      value={{
        connectedWallet,
        setConnectedWallet,
        isConnected: !!connectedWallet,
        disconnect,
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
}
