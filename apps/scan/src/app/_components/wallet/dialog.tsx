'use client';

import { useSearchParams } from 'next/navigation';

import { useCurrentUser } from '@coinbase/cdp-hooks';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { DisplayWalletDialogContent } from './connected';
import { ConnectWalletDialogContent } from './connect';

import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';

import { WalletChainProvider } from './chain-context/provider';

import type { Chain } from '@/types/chain';

interface Props {
  children: React.ReactNode;
  initialChain?: Chain;
  isFixed?: boolean;
}

export const WalletDialog: React.FC<Props> = ({
  children,
  initialChain,
  isFixed,
}) => {
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
          <WalletChainProvider
            connectedWallets={connectedWallets}
            initialChain={(searchParams.get('chain') as Chain) ?? initialChain}
            isFixed={isFixed}
          >
            <DisplayWalletDialogContent
              connectedWallets={connectedWallets}
              user={currentUser ?? undefined}
              defaultTab={
                searchParams.get('onramp') === 'true' ? 'deposit' : 'wallet'
              }
            />
          </WalletChainProvider>
        ) : (
          <WalletChainProvider
            initialChain={(searchParams.get('chain') as Chain) ?? initialChain}
            isFixed={isFixed}
          >
            <ConnectWalletDialogContent />
          </WalletChainProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};
