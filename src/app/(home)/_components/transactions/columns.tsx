'use client';

import { Calendar, DollarSign, Globe, Hash, Server, User } from 'lucide-react';

import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { Address } from '@/components/ui/address';

import { Seller, SellerSkeleton } from '@/app/_components/seller';
import { Facilitator } from '@/app/_components/facilitator';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { TransfersSortingContext } from '@/app/_contexts/sorting/transfers/context';
import { Chains } from '@/app/_components/chains';

type ColumnType = RouterOutputs['public']['transfers']['list']['items'][number];

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
          addressClassName="text-xs font-normal"
          disableCopy
        />
      </Link>
    ),
    size: 200,
    loading: () => <SellerSkeleton />,
  },
  {
    accessorKey: 'amount',
    header: () => (
      <HeaderCell
        Icon={DollarSign}
        label="Amount"
        className="mx-auto"
        sorting={{
          sortContext: TransfersSortingContext,
          sortKey: 'amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.amount))}
      </div>
    ),
    size: 100, // Fixed width for buyers count
    loading: () => <Skeleton className="h-4 w-16 ml-auto" />,
  },
  {
    accessorKey: 'sender',
    header: () => <HeaderCell Icon={User} label="Sender" className="mx-auto" />,
    cell: ({ row }) => (
      <Address
        address={row.original.sender}
        className="text-xs mx-auto block text-center"
      />
    ),
    size: 150, // Fixed width for transaction count
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
    size: 150,
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
    accessorKey: 'chains',
    header: () => <HeaderCell Icon={Globe} label="Chain" className="mx-auto" />,
    cell: ({ row }) => (
      <Chains
        chains={[row.original.chain]}
        iconClassName="size-4"
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    loading: () => <Skeleton className="size-4 mx-auto" />,
  },
  {
    accessorKey: 'facilitator',
    header: () => (
      <HeaderCell Icon={Server} label="Facilitator" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <Facilitator
        id={row.original.facilitator_id}
        className="mx-auto justify-center"
      />
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
