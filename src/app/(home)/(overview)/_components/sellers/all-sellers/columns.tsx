'use client';

import { Calendar, DollarSign, Hash, Server } from 'lucide-react';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { Seller, SellerSkeleton } from '@/app/_components/seller';
import { Facilitators } from '@/app/_components/facilitator';

import { formatCount, formatTokenAmount } from '@/lib/token';
import { formatCompactAgo } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { SellersSortingContext } from '../../../../../_contexts/sorting/sellers/context';
import Link from 'next/link';

type ColumnType = RouterOutputs['sellers']['list']['all']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'recipient',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="justify-start" />
    ),
    cell: ({ row }) => (
      <Link href={`/recipient/${row.original.recipient}`} prefetch={false}>
        <Seller
          address={row.original.recipient}
          disableCopy
          addressClassName="font-normal"
        />
      </Link>
    ),
    size: 225, // Fixed width for seller column (widest for address display)
    loading: () => <SellerSkeleton />,
  },
  {
    accessorKey: 'tx_count',
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="Txns"
        sorting={{
          sortContext: SellersSortingContext,
          sortKey: 'tx_count',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCount(row.original.tx_count)}
      </div>
    ),
    size: 100, // Fixed width for transaction count
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
          sortContext: SellersSortingContext,
          sortKey: 'total_amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </div>
    ),
    size: 100, // Fixed width for volume column
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'unique_buyers',
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="Buyers"
        sorting={{
          sortContext: SellersSortingContext,
          sortKey: 'unique_buyers',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCount(row.original.unique_buyers)}
      </div>
    ),
    size: 100, // Fixed width for buyers count
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'latest_block_timestamp',
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Latest"
        sorting={{
          sortContext: SellersSortingContext,
          sortKey: 'latest_block_timestamp',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.latest_block_timestamp)}
      </div>
    ),
    size: 100, // Fixed width for timestamp
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'facilitators',
    header: () => (
      <HeaderCell Icon={Server} label="Facilitator" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <Facilitators
        addresses={row.original.facilitators}
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
