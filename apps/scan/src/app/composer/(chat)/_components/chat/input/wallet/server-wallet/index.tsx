import { useSession } from 'next-auth/react';

import { Loading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';

import { LoadingWalletButton, WalletButton } from '../button';

import { WalletDialog } from './dialog';

import { api } from '@/trpc/client';
import { Chain } from '@/types/chain';
import { Address } from 'viem';

export const ServerWalletButton = () => {
  const { data: session } = useSession();

  const { data: address, isLoading: isLoadingAddress } =
    api.user.serverWallet.address.useQuery(
      {
        chain: Chain.BASE,
      },
      {
        enabled: !!session,
      }
    );

  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.user.serverWallet.tokenBalance.useQuery(
      {
        chain: Chain.BASE,
      },
      {
        enabled: !!session,
      }
    );

  const { isLoading: isLoadingHasUserAcknowledgedComposer } =
    api.user.acknowledgements.hasAcknowledged.useQuery();

  if (isLoadingAddress || isLoadingHasUserAcknowledgedComposer) {
    return <LoadingWalletButton />;
  }

  if (!address) {
    return null;
  }

  return (
    <WalletDialog address={address as Address}>
      <WalletButton
        className={
          usdcBalance !== undefined && usdcBalance < 0.1
            ? 'text-primary bg-primary/10 border-primary'
            : ''
        }
      >
        <Loading
          isLoading={isLoadingUsdcBalance}
          value={usdcBalance}
          component={balance =>
            balance < 0.1 ? 'Add Funds' : `${balance?.toPrecision(3)} USDC`
          }
          loadingComponent={<Skeleton className="h-3 w-8" />}
        />
      </WalletButton>
    </WalletDialog>
  );
};
