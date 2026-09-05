import { useWallets } from "@wallet-standard/react";

import { ConnectSVMInjectedWalletButtons } from "@/app/(app)/composer/_components/wallet/connect/injected/buttons/svm";

export const SVMNotConnected = () => {
  const allWallets = useWallets();

  const wallets = allWallets.filter((wallet) =>
    wallet.chains.includes(`solana:mainnet`)
  );

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md bg-muted p-2 type-caption">
        <p>No Solana wallets found</p>
      </div>
    );
  }

  return <ConnectSVMInjectedWalletButtons wallets={wallets} />;
};
