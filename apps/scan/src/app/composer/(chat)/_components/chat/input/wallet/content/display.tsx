'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/client';

import { ComposerWalletAddressCopyCode } from './address';

export const WalletDisplay: React.FC = () => {
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.user.serverWallet.usdcBaseBalance.useQuery();

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <ItemContainer
        label="Balance"
        value={
          isLoadingUsdcBalance ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <p className="bg-muted rounded-md border p-2">
              {usdcBalance?.toPrecision(3)} USDC
            </p>
          )
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
