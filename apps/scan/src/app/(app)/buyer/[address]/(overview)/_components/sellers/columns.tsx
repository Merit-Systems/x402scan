'use client';

import {
  Activity,
  ArrowLeftRight,
  Calendar,
  DollarSign,
  Globe,
  Server,
  User,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { SellerChart, LoadingSellerChart } from './chart';

import { Seller, SellerSkeleton } from '@/app/(app)/_components/seller';
import { Facilitators } from '@/app/(app)/_components/facilitator';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { BuyerSellersSortingContext } from './sorting-provider';
import { Chains } from '@/app/(app)/_components/chains';

type ColumnType =
  RouterOutputs['public']['buyers']['all']['sellers']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'recipient',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="mr-auto" />
    ),
    cell: ({ row }) => (
      <Seller
        address={row.original.recipient}
        disableCopy
        addressClassName="font-normal"
      />
    ),
    size: 225,
    loading: () => <SellerSkeleton />,
  },
  {
    accessorKey: 'chart',
    header: () => (
      <HeaderCell Icon={Activity} label="Activity" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <SellerChart addresses={[row.original.recipient]} />
    ),
    size: 100,
    loading: () => <LoadingSellerChart />,
  },
  {
    accessorKey: 'tx_count',
    header: () => (
      <HeaderCell
        Icon={ArrowLeftRight}
        label="Txns"
        className="mx-auto"
        sorting={{
          sortContext: BuyerSellersSortingContext,
          sortKey: 'tx_count',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.tx_count.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'total_amount',
    header: () => (
      <HeaderCell
        Icon={DollarSign}
        label="Volume"
        className="mx-auto"
        sorting={{
          sortContext: BuyerSellersSortingContext,
          sortKey: 'total_amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(Math.round(row.original.total_amount)))}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'latest_block_timestamp',
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Latest"
        sorting={{
          sortContext: BuyerSellersSortingContext,
          sortKey: 'latest_block_timestamp',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.latest_block_timestamp
          ? formatCompactAgo(row.original.latest_block_timestamp)
          : '–'}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'chains',
    header: () => <HeaderCell Icon={Globe} label="Chain" className="mx-auto" />,
    cell: ({ row }) => (
      <Chains
        chains={row.original.chains}
        iconClassName="size-4"
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    loading: () => <Skeleton className="size-4 mx-auto" />,
  },
  {
    accessorKey: 'facilitator_ids',
    header: () => (
      <HeaderCell Icon={User} label="Facilitator" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <Facilitators
        ids={row.original.facilitator_ids}
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
