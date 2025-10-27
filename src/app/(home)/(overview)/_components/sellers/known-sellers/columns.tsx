'use client';

import {
  Activity,
  ArrowLeftRight,
  Calendar,
  DollarSign,
  Globe,
  Server,
  Users,
} from 'lucide-react';

import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';

import { KnownSellerChart, LoadingKnownSellerChart } from './chart';

import { Origins, OriginsSkeleton } from '@/app/_components/origins';
import { Facilitators } from '@/app/_components/facilitator';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { SellersSortingContext } from '../../../../../_contexts/sorting/sellers/context';
import { Chains } from '@/app/_components/chains';

type ColumnType =
  RouterOutputs['public']['sellers']['list']['bazaar']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'recipients',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="mr-auto" />
    ),
    cell: ({ row }) => (
      <Link href={`/recipient/${row.original.recipients[0]}`} prefetch={false}>
        <Origins
          origins={row.original.origins}
          addresses={row.original.recipients}
          disableCopy
        />
      </Link>
    ),
    size: 225,
    loading: () => <OriginsSkeleton />,
  },

  {
    accessorKey: 'chart',
    header: () => (
      <HeaderCell Icon={Activity} label="Activity" className="mx-auto" />
    ),
    cell: ({ row }) => <KnownSellerChart addresses={row.original.recipients} />,
    size: 100,
    loading: () => <LoadingKnownSellerChart />,
  },
  {
    accessorKey: 'tx_count',
    header: () => (
      <HeaderCell
        Icon={ArrowLeftRight}
        label="Txns"
        className="mx-auto"
        sorting={{
          sortContext: SellersSortingContext,
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
        Icon={Users}
        label="Buyers"
        className="mx-auto"
        sorting={{
          sortContext: SellersSortingContext,
          sortKey: 'unique_buyers',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_buyers.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
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
    accessorKey: 'facilitators',
    header: () => (
      <HeaderCell Icon={Server} label="Facilitator" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <Facilitators
        ids={row.original.facilitators}
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
