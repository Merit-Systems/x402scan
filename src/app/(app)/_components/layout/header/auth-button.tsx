'use client';

import { Wallet } from 'lucide-react';

import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { OnrampSessionDialog } from '@/app/(app)/_components/wallet/onramp-session-dialog';

import { useBalance } from '@/app/(app)/_hooks/use-balance';

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
          <Button size="navbar" variant="outline">
            <Wallet className="size-4" />
            <span className="hidden md:block">Connect</span>
          </Button>
        )}
      </WalletDialog>
    </>
  );
};

const ConnectedButton = ({ onClick }: { onClick?: () => void }) => {
  const { data: balance, isLoading } = useBalance();

  return (
    <Button size="navbar" variant="outline" onClick={onClick}>
      <Wallet className="size-4" />
      {isLoading ? (
        <Skeleton className="h-4 w-20 hidden md:block" />
      ) : (
        <span className="hidden md:block">{`${(balance ?? 0).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            notation: 'compact',
          }
        )} USDC`}</span>
      )}
    </Button>
  );
};
