'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { Address } from '@/components/ui/address';

import { Origins } from '@/app/_components/origins';
import { api } from '@/trpc/client';
import { cn } from '@/lib/utils';
import type { MixedAddress } from '@/types/address';

interface Props {
  address: MixedAddress;
  disableCopy?: boolean;
  addressClassName?: string;
}

export const Seller: React.FC<Props> = ({
  address,
  addressClassName,
  disableCopy,
}) => {
  const {
    data: origins,
    isLoading,
    error,
  } = api.public.origins.list.origins.useQuery(
    {
      address,
    },
    {
      enabled: !!address,
    }
  );

  if (error) {
    console.log(address);
  }

  if (isLoading) {
    return <SellerSkeleton />;
  }

  if (!origins || origins.length === 0) {
    return (
      <Address
        address={address}
        className={cn('text-xs font-medium', addressClassName)}
        disableCopy={disableCopy}
      />
    );
  }

  return <Origins origins={origins} addresses={[address]} />;
};

export const SellerSkeleton = () => {
  return <Skeleton className="h-4 w-32" />;
};
