'use client';

import { Calendar, DollarSign, Hash, Server, User } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { Address } from '@/components/ui/address';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { Seller, SellerSkeleton } from '@/app/_components/seller';
import { TransfersSortingContext } from '@/app/_contexts/sorting/transfers/context';

type ColumnType = RouterOutputs['public']['transfers']['list']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'recipient',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="mr-auto" />
    ),
    cell: ({ row }) => (
      <Seller
        address={row.original.recipient}
        addressClassName="text-xs font-normal"
      />
    ),
    size: 300, // Fixed width for seller column (widest for address display)
    loading: () => <SellerSkeleton />,
  },
  {
    accessorKey: 'sender',
    header: () => <HeaderCell Icon={User} label="Sender" className="mx-auto" />,
    cell: ({ row }) => (
      <Address
        address={row.original.sender}
        className="text-xs block text-center"
      />
    ),
    size: 200,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'transaction_hash',
    header: () => <HeaderCell Icon={Hash} label="Hash" className="mx-auto" />,
    cell: ({ row }) => (
      <Address
        address={row.original.tx_hash}
        className="text-xs block text-center"
        disableCopy
        hideTooltip
      />
    ),
    size: 200,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'block_timestamp',
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Timestamp"
        className="mx-auto"
        sorting={{
          sortContext: TransfersSortingContext,
          sortKey: 'block_timestamp',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.block_timestamp)}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'amount',
    header: () => (
      <HeaderCell
        Icon={DollarSign}
        label="Amount"
        className="ml-auto"
        sorting={{
          sortContext: TransfersSortingContext,
          sortKey: 'amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.amount))}
      </div>
    ),
    size: 150, // Fixed width for buyers count
    loading: () => <Skeleton className="h-4 w-16 ml-auto" />,
  },
];
