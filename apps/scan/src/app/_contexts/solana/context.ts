'use client';

import { createContext } from 'react';

import type { UiWalletAccount, UiWallet } from '@wallet-standard/react';

export interface ConnectedSolanaWallet {
  account: UiWalletAccount;
  wallet: UiWallet;
}

interface SolanaWalletContextType {
  connectedWallet: ConnectedSolanaWallet | null;
  setConnectedWallet: (wallet: ConnectedSolanaWallet | null) => void;
  disconnect: () => void;
  isConnected: boolean;
}

export const SolanaWalletContext = createContext<
  SolanaWalletContextType | undefined
>(undefined);
