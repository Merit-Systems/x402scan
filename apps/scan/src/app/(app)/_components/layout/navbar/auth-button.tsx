'use client';

import { Wallet } from 'lucide-react';

import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';

import { OnrampSessionDialog } from '@/app/(app)/_components/wallet/onramp-session-dialog';

import { WalletDialog } from '../../../_components/wallet/dialog';

export const NavbarAuthButton = () => {
  const { address } = useAccount();

  return (
    <>
      <OnrampSessionDialog />
      <WalletDialog watchOnramp>
        {address ? (
          <ConnectedButton />
        ) : (
          <Button size="icon" variant="outline">
            <Wallet className="size-4" />
          </Button>
        )}
      </WalletDialog>
    </>
  );
};

const ConnectedButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button size="icon" variant="outline" onClick={onClick}>
      <Wallet className="size-4" />
    </Button>
  );
};
