'use client';

import { Wallet } from 'lucide-react';

import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';

import { OnrampSessionDialog } from '@/app/_components/wallet/onramp-session-dialog';

import { WalletDialog } from '../../wallet/dialog';

export const NavbarAuthButton = () => {
  const { address } = useAccount();

  return (
    <>
      <OnrampSessionDialog />
      <WalletDialog>
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
