import { useWallets } from '@wallet-standard/react';

import { ConnectInjectedWalletButtonsWrapper } from './wrapper';

import { ConnectSVMInjectedWalletButtons } from '../buttons/svm';
import { ConnectInjectedWalletEmpty } from './empty';

export const ConnectSVMInjectedWalletForm = () => {
  const allWallets = useWallets();

  const wallets = allWallets.filter(wallet =>
    wallet.chains.includes(`solana:mainnet`)
  );

  return (
    <ConnectInjectedWalletButtonsWrapper>
      {wallets.length > 0 ? (
        <ConnectSVMInjectedWalletButtons wallets={wallets} />
      ) : (
        <ConnectInjectedWalletEmpty />
      )}
    </ConnectInjectedWalletButtonsWrapper>
  );
};
