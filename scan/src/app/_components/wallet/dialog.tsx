'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentUser } from '@coinbase/cdp-hooks';
import { useAccount } from 'wagmi';
import { DisplayWalletDialogContent } from './display';
import { ConnectWalletDialogContent } from './connect';
import { useSearchParams } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

export const WalletDialog: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();

  const { address } = useAccount();

  const { currentUser } = useCurrentUser();

  return (
    <Dialog defaultOpen={searchParams.get('onramp') === 'true'}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 overflow-hidden sm:max-w-md"
        showCloseButton={false}
      >
        {address ? (
          <DisplayWalletDialogContent
            address={address}
            user={currentUser ?? undefined}
            defaultTab={
              searchParams.get('onramp') === 'true' ? 'deposit' : 'wallet'
            }
          />
        ) : (
          <ConnectWalletDialogContent />
        )}
      </DialogContent>
    </Dialog>
  );
};
