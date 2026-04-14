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

import { Skeleton } from '@/components/ui/skeleton';

import {
  KnownSellerChart,
  LoadingKnownSellerChart,
} from '../../(overview)/_components/sellers/known-sellers/chart';

import { Origins, OriginsSkeleton } from '@/app/(app)/_components/origins';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { SellersSortingContext } from '@/app/(app)/_contexts/sorting/sellers/context';
import { Chains } from '@/app/(app)/_components/chains';

type ColumnType =
  RouterOutputs['public']['sellers']['bazaar']['list']['items'][number];

export const discoverColumns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'recipients',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="mr-auto" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Origins
            origins={row.original.origins}
            addresses={row.original.recipients}
            disableCopy
          />
        </div>
      );
    },
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
    size: 100,
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
          sortContext: SellersSortingContext,
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
    accessorKey: 'tryIt',
    header: () => <span />,
    cell: ({ row }) => {
      const origin = row.original.origins[0]?.origin;
      if (!origin) return null;
      const stripped = origin.replace(/^https?:\/\//, '');
      return (
        <a
          href={`https://tryponcho.com/p/${stripped}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          onClick={e => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://tryponcho.com/favicon.svg"
            alt="Poncho"
            className="size-4"
          />
          Try in Poncho
        </a>
      );
    },
    size: 130,
    loading: () => <Skeleton className="h-4 w-24 mx-auto" />,
  },
];
