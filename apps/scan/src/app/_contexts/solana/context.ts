'use client';

import { createContext } from 'react';

import type { UiWalletAccount, UiWallet } from '@wallet-standard/react';

export type ConnectedSolanaWallet = {
  account: UiWalletAccount;
  wallet: UiWallet;
};

type SolanaWalletContextType = {
  connectedWallet: ConnectedSolanaWallet | null;
  setConnectedWallet: (wallet: ConnectedSolanaWallet | null) => void;
  disconnect: () => void;
  isConnected: boolean;
};

export const SolanaWalletContext = createContext<
  SolanaWalletContextType | undefined
>(undefined);
