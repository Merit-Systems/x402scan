'use client';

import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { Address } from '@/components/ui/address';

import { cn } from '@/lib/utils';

import type { MixedAddress } from '@/types/address';

interface Props {
  address: MixedAddress;
  disableCopy?: boolean;
  addressClassName?: string;
}

export const Buyer: React.FC<Props> = ({
  address,
  addressClassName,
  disableCopy,
}) => {
  return (
    <Link
      href={`/buyer/${address}`}
      prefetch={false}
      aria-label={`Buyer profile ${address}`}
    >
      <Address
        address={address}
        className={cn('text-xs font-medium hover:underline', addressClassName)}
        disableCopy={disableCopy}
      />
    </Link>
  );
};

interface BuyerSkeletonProps {
  className?: string;
}

export const BuyerSkeleton: React.FC<BuyerSkeletonProps> = ({ className }) => {
  return <Skeleton className={cn('h-4 w-32', className)} />;
};
