'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentUser } from '@coinbase/cdp-hooks';
import { useAccount } from 'wagmi';
import { DisplayWalletDialogContent } from './connected';
import { ConnectWalletDialogContent } from './connect';
import { useSearchParams } from 'next/navigation';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';
import { WalletChainProvider } from './connected/chain-context/provider';

import { useSolanaStandardWallets } from '@coinbase/cdp-solana-standard-wallet';

interface Props {
  children: React.ReactNode;
}

export const WalletDialog: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();

  const connectedWallets = useConnectedWallets();

  const { currentUser } = useCurrentUser();

  return (
    <Dialog defaultOpen={searchParams.get('onramp') === 'true'}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 overflow-hidden sm:max-w-md"
        showCloseButton={false}
      >
        {connectedWallets.isConnected ? (
          <WalletChainProvider connectedWallets={connectedWallets}>
            <DisplayWalletDialogContent
              connectedWallets={connectedWallets}
              user={currentUser ?? undefined}
              defaultTab={
                searchParams.get('onramp') === 'true' ? 'deposit' : 'wallet'
              }
            />
          </WalletChainProvider>
        ) : (
          <ConnectWalletDialogContent />
        )}
      </DialogContent>
    </Dialog>
  );
};
