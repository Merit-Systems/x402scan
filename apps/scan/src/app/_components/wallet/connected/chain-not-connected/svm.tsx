import { useWallets } from '@wallet-standard/react';

import { ConnectSVMInjectedWallet } from '../../connect/injected/svm';

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

  return <ConnectSVMInjectedWallet wallets={wallets} />;
};
