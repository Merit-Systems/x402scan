import { useContext } from 'react';

import { SolanaWalletContext } from './context';

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext);
  if (context === undefined) {
    throw new Error(
      'useSolanaWallet must be used within a SolanaWalletProvider'
    );
  }
  return context;
}
