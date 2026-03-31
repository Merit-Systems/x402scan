'use client';

import Link from 'next/link';

import { Calendar, DollarSign, Globe, Hash, Server, User } from 'lucide-react';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { Address } from '@/components/ui/address';
import { Facilitators } from '@/app/(app)/_components/facilitator';
import { BuyerTopServers, LoadingBuyerTopServers } from './top-servers';

import { formatTokenAmount } from '@/lib/token';
import { formatCompactAgo } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { BuyersSortingContext } from '../../../../_contexts/sorting/buyers/context';
import { Chains } from '@/app/(app)/_components/chains';

type ColumnType =
  RouterOutputs['public']['buyers']['all']['list']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'sender',
    header: () => (
      <HeaderCell Icon={User} label="Buyer" className="justify-start" />
    ),
    cell: ({ row }) => (
      <Link href={`/buyer/${row.original.sender}`}>
        <Address
          address={row.original.sender}
          disableCopy
          className="font-normal hover:underline"
        />
      </Link>
    ),
    size: 225,
    loading: () => <Skeleton className="h-4 w-32" />,
  },
  {
    accessorKey: 'top_servers',
    header: () => (
      <HeaderCell Icon={Server} label="Servers" className="mx-auto" />
    ),
    cell: ({ row }) => <BuyerTopServers sender={row.original.sender} />,
    size: 100,
    loading: () => <LoadingBuyerTopServers />,
  },
  {
    accessorKey: 'tx_count',
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="Txns"
        sorting={{
          sortContext: BuyersSortingContext,
          sortKey: 'tx_count',
        }}
        className="mx-auto"
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
          sortContext: BuyersSortingContext,
          sortKey: 'total_amount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'unique_sellers',
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="Sellers"
        sorting={{
          sortContext: BuyersSortingContext,
          sortKey: 'unique_sellers',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_sellers.toLocaleString(undefined, {
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
    accessorKey: 'latest_block_timestamp',
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Latest"
        sorting={{
          sortContext: BuyersSortingContext,
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
