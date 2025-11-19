'use client';

import { useSession } from 'next-auth/react';

import { Skeleton } from '@/components/ui/skeleton';

import { ComposerWalletAddressCopyCode } from './address';

import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';

import { api } from '@/trpc/client';

export const WalletDisplay: React.FC = () => {
  const { data: session } = useSession();

  const { chain } = useWalletChain();

  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.user.serverWallet.tokenBalance.useQuery(
      {
        chain,
      },
      {
        enabled: !!session,
      }
    );

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <ItemContainer
        label="Balance"
        value={
          <div className="bg-muted rounded-md border p-2">
            {isLoadingUsdcBalance ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <p>{usdcBalance?.toPrecision(3)} USDC</p>
            )}
          </div>
        }
      />
      <ItemContainer
        label="Address"
        value={<ComposerWalletAddressCopyCode />}
      />
    </div>
  );
};

const ItemContainer = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium font-mono">{label}</p>
      {value}
    </div>
  );
};
