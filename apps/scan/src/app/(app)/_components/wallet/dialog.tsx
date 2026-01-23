'use client';

import { useSearchParams } from 'next/navigation';

import { useCurrentUser } from '@coinbase/cdp-hooks';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import { DisplayWalletDialogContent } from './connected';
import { ConnectWalletDialogContent } from './connect';

import { useConnectedWallets } from '@/app/(app)/_hooks/use-connected-wallets';

import { WalletChainProvider } from '../../_contexts/wallet-chain/provider';

import { parseChain } from '@/app/(app)/_lib/chain/parse';

import type { SupportedChain } from '@/types/chain';

interface Props {
  children: React.ReactNode;
  initialTab?: 'wallet' | 'deposit' | 'withdraw';
  initialChain?: SupportedChain;
  isFixed?: boolean;
  watchOnramp?: boolean;
}

export const WalletDialog: React.FC<Props> = ({
  children,
  initialChain,
  initialTab = 'wallet',
  isFixed,
  watchOnramp = false,
}) => {
  const searchParams = useSearchParams();

  const connectedWallets = useConnectedWallets();

  const { currentUser } = useCurrentUser();

  const initialChainParam = parseChain(searchParams.get('chain'));

  return (
    <Dialog
      defaultOpen={watchOnramp ? searchParams.get('onramp') === 'true' : false}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 overflow-hidden sm:max-w-md"
        showCloseButton={false}
      >
        {connectedWallets.isConnected ? (
          <WalletChainProvider
            connectedWallets={connectedWallets}
            initialChain={initialChainParam ?? initialChain}
            isFixed={isFixed}
          >
            <DisplayWalletDialogContent
              connectedWallets={connectedWallets}
              user={currentUser ?? undefined}
              defaultTab={
                watchOnramp && searchParams.get('onramp') === 'true'
                  ? 'deposit'
                  : initialTab
              }
            />
          </WalletChainProvider>
        ) : (
          <WalletChainProvider
            initialChain={initialChainParam ?? initialChain}
            isFixed={isFixed}
          >
            <ConnectWalletDialogContent />
          </WalletChainProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};
