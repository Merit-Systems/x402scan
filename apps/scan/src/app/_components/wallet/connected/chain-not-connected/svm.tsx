import { useWallets } from '@wallet-standard/react';

import { ConnectSVMInjectedWalletButtons } from '../../connect/injected/buttons/svm';

export const SVMNotConnected = () => {
  const allWallets = useWallets();

  const wallets = allWallets.filter(wallet =>
    wallet.chains.includes(`solana:mainnet`)
  );

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-xs">
        <p>No Solana wallets found</p>
      </div>
    );
  }

  return <ConnectSVMInjectedWalletButtons wallets={wallets} />;
};
