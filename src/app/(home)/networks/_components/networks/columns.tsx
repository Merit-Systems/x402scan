'use client';

import {
  ArrowLeftRight,
  Calendar,
  DollarSign,
  Globe,
  Server,
  User,
} from 'lucide-react';

import Image from 'next/image';

import { Skeleton } from '@/components/ui/skeleton';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { NetworksSortingContext } from '@/app/_contexts/sorting/networks/context';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';

type ColumnType = RouterOutputs['networks']['list'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'chain',
    header: () => (
      <HeaderCell Icon={Globe} label="Network" className="justify-start" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Image
          src={row.original.icon}
          alt={row.original.label}
          width={16}
          height={16}
          className="rounded-md"
        />
        <p className="text-xs font-semibold">{row.original.label}</p>
      </div>
    ),
    size: 200,
    loading: () => (
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-md" />
        <Skeleton className="w-20 h-4" />
      </div>
    ),
  },
  {
    accessorKey: 'transactions',
    header: () => (
      <HeaderCell
        Icon={ArrowLeftRight}
        label="Transactions"
        className="mx-auto"
        sorting={{
          sortContext: NetworksSortingContext,
          sortKey: 'tx_count',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.tx_count.toLocaleString()}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'volume',
    header: () => (
      <HeaderCell
        Icon={DollarSign}
        label="Volume"
        className="mx-auto"
        sorting={{
          sortContext: NetworksSortingContext,
          sortKey: 'total_amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'facilitators',
    header: () => (
      <HeaderCell
        Icon={Server}
        label="Facilitators"
        className="mx-auto"
        sorting={{
          sortContext: NetworksSortingContext,
          sortKey: 'unique_facilitators',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_facilitators.toLocaleString()}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'sellers',
    header: () => (
      <HeaderCell
        Icon={User}
        label="Sellers"
        className="mx-auto"
        sorting={{
          sortContext: NetworksSortingContext,
          sortKey: 'unique_sellers',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_sellers.toLocaleString()}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'buyers',
    header: () => (
      <HeaderCell
        Icon={User}
        label="Buyers"
        className="mx-auto"
        sorting={{
          sortContext: NetworksSortingContext,
          sortKey: 'unique_buyers',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_buyers.toLocaleString()}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'latest_block_timestamp',
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Latest"
        className="ml-auto"
        sorting={{
          sortContext: NetworksSortingContext,
          sortKey: 'latest_block_timestamp',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {formatCompactAgo(row.original.latest_block_timestamp)}
      </div>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-16 ml-auto" />,
  },
];
