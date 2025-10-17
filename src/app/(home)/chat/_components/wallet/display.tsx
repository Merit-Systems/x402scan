'use client';

import { CopyCode } from '@/components/ui/copy-code';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/client';

import type { Address } from 'viem';

interface Props {
  address: Address;
}

export const WalletDisplay: React.FC<Props> = ({ address }) => {
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.serverWallet.usdcBaseBalance.useQuery();

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
        value={
          <CopyCode code={address} toastMessage="Address copied to clipboard" />
        }
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
