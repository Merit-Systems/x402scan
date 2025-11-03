import { useWallets } from '@wallet-standard/react';

import { ConnectInjectedWalletButtonsWrapper } from './wrapper';

import { ConnectSVMInjectedWalletButtons } from '../buttons/svm';

export const ConnectSVMInjectedWalletForm = () => {
  const allWallets = useWallets();

  const wallets = allWallets.filter(wallet =>
    wallet.chains.includes(`solana:mainnet`)
  );

  if (wallets.length === 0) {
    return null;
  }

  return (
    <ConnectInjectedWalletButtonsWrapper>
      <ConnectSVMInjectedWalletButtons wallets={wallets} />
    </ConnectInjectedWalletButtonsWrapper>
  );
};
