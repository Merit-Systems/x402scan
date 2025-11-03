'use client';

import { createContext } from 'react';

import type { UiWalletAccount, UiWallet } from '@wallet-standard/react';
import type { Wallet, WalletAccount } from '@wallet-standard/base';

export interface ConnectedSolanaWallet {
  account: UiWalletAccount | WalletAccount;
  wallet: UiWallet | Wallet;
}

export interface SolanaWalletContextType {
  connectedWallet: ConnectedSolanaWallet | null;
  setConnectedWallet: (wallet: ConnectedSolanaWallet | null) => void;
  disconnect: () => void;
  isConnected: boolean;
}

export const SolanaWalletContext = createContext<
  SolanaWalletContextType | undefined
>(undefined);
