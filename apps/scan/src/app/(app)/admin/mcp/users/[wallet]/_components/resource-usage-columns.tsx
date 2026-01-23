'use client';

import { ArrowLeftRight, Calendar, DollarSign, Server } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Origins, OriginsSkeleton } from '@/app/(app)/_components/origins';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import type { MixedAddress } from '@/types/address';

type ColumnType = RouterOutputs['admin']['users']['buyerResourceUsage'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'recipient',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="mr-auto" />
    ),
    cell: ({ row }) => {
      return (
        <Origins
          addresses={[row.original.recipient as MixedAddress]}
          origins={row.original.origins}
          disableCopy
        />
      );
    },
    size: 225,
    loading: () => <OriginsSkeleton />,
  },
  {
    accessorKey: 'total_transactions',
    header: () => (
      <HeaderCell Icon={ArrowLeftRight} label="Txns" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.total_transactions.toLocaleString(undefined, {
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
      <HeaderCell Icon={DollarSign} label="Amount Spent" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(Math.round(row.original.total_amount)))}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'last_used',
    header: () => (
      <HeaderCell Icon={Calendar} label="Last Used" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.last_used
          ? formatCompactAgo(row.original.last_used)
          : '–'}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
