'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useWallets } from '@wallet-standard/react';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { StandardConnect } from '@wallet-standard/core';

import type { UiWallet, UiWalletAccount } from '@wallet-standard/react';

// Create RPC connection
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const WS_ENDPOINT = 'wss://api.mainnet-beta.solana.com';
const chain = 'solana:mainnet';
const rpc = createSolanaRpc(RPC_ENDPOINT);
const ws = createSolanaRpcSubscriptions(WS_ENDPOINT);

interface SolanaContextState {
  // RPC
  rpc: ReturnType<typeof createSolanaRpc>;
  ws: ReturnType<typeof createSolanaRpcSubscriptions>;
  chain: typeof chain;

  // Wallet State
  wallets: UiWallet[];
  selectedWallet: UiWallet | null;
  selectedAccount: UiWalletAccount | null;
  isConnected: boolean;

  // Wallet Actions
  setWalletAndAccount: (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => void;
}

const SolanaContext = createContext<SolanaContextState | undefined>(undefined);

export function useSolana() {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
}

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const allWallets = useWallets();

  console.log(allWallets);

  // Filter for Solana wallets only that support signAndSendTransaction
  const wallets = useMemo(() => {
    return allWallets.filter(
      wallet =>
        wallet.chains?.some(c => c.startsWith('solana:')) &&
        wallet.features.includes(StandardConnect) &&
        wallet.features.includes('solana:signAndSendTransaction')
    );
  }, [allWallets]);

  // State management
  const [selectedWallet, setSelectedWallet] = useState<UiWallet | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<UiWalletAccount | null>(null);

  // Check if connected (account must exist in the wallet's accounts)
  const isConnected = useMemo(() => {
    if (!selectedAccount || !selectedWallet) return false;

    // Find the wallet and check if it still has this account
    const currentWallet = wallets.find(w => w.name === selectedWallet.name);
    return !!(
      currentWallet &&
      currentWallet.accounts.some(
        acc => acc.address === selectedAccount.address
      )
    );
  }, [selectedAccount, selectedWallet, wallets]);

  const setWalletAndAccount = (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => {
    setSelectedWallet(wallet);
    setSelectedAccount(account);
  };

  // Create context value
  const contextValue = useMemo<SolanaContextState>(
    () => ({
      // Static RPC values
      rpc,
      ws,
      chain,

      // Dynamic wallet values
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      setWalletAndAccount,
    }),
    [wallets, selectedWallet, selectedAccount, isConnected]
  );

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}
