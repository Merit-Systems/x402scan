'use client';

import {
  ArrowLeftRight,
  Calendar,
  DollarSign,
  Globe,
  Server,
  User,
} from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';

import { Skeleton } from '@/components/ui/skeleton';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { FacilitatorsSortingContext } from '@/app/_contexts/sorting/facilitators/context';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { Chains } from '@/app/_components/chains';

type ColumnType =
  RouterOutputs['public']['facilitators']['list']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'facilitator_name',
    header: () => (
      <HeaderCell Icon={Server} label="Facilitator" className="justify-start" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/facilitator/${row.original.facilitator_id}`}
        prefetch={false}
        className="flex items-center gap-1"
      >
        <Image
          src={row.original.facilitator.image}
          alt={row.original.facilitator.name}
          width={16}
          height={16}
          className="rounded-md"
        />
        <p className="text-xs font-semibold">{row.original.facilitator.name}</p>
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: row.original.facilitator.color }}
        />
      </Link>
    ),
    size: 250,
    loading: () => (
      <div className="flex items-center gap-1">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="w-16 h-4" />
        <Skeleton className="size-2 rounded-full" />
      </div>
    ),
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
    accessorKey: 'transactions',
    header: () => (
      <HeaderCell
        Icon={ArrowLeftRight}
        label="Transactions"
        className="mx-auto"
        sorting={{
          sortContext: FacilitatorsSortingContext,
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
          sortContext: FacilitatorsSortingContext,
          sortKey: 'total_amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </div>
    ),
    size: 150, // Fixed width for transaction count
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
          sortContext: FacilitatorsSortingContext,
          sortKey: 'unique_sellers',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_sellers.toLocaleString()}{' '}
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
          sortContext: FacilitatorsSortingContext,
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
          sortContext: FacilitatorsSortingContext,
          sortKey: 'latest_block_timestamp',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {formatCompactAgo(row.original.latest_block_timestamp)}
      </div>
    ),
    size: 150, // Fixed width for buyers count
    loading: () => <Skeleton className="h-4 w-16 ml-auto" />,
  },
];
