'use client';

import { Calendar, DollarSign, Hash, Wallet } from 'lucide-react';

import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactAgo, formatCurrency } from '@/lib/utils';
import { formatUnits } from 'viem';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';

type ColumnType = RouterOutputs['admin']['users']['list'][number];

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const createColumns = (): ExtendedColumnDef<ColumnType>[] => [
  {
    accessorKey: 'recipientAddr',
    header: () => (
      <HeaderCell Icon={Wallet} label="Wallet" className="justify-start" />
    ),
    cell: ({ row }) => (
      <a
        href={`/admin/mcp/users/${row.original.recipientAddr}`}
        className="text-xs font-mono hover:underline text-primary"
      >
        {truncateAddress(row.original.recipientAddr)}
      </a>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-24" />,
  },
  {
    accessorKey: 'totalRedemptions',
    header: () => (
      <HeaderCell Icon={Hash} label="Redemptions" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.totalRedemptions}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-12 mx-auto" />,
  },
  {
    accessorKey: 'totalAmount',
    header: () => (
      <HeaderCell Icon={DollarSign} label="Total Received" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCurrency(parseFloat(formatUnits(row.original.totalAmount, 6)))}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'firstRedemption',
    header: () => (
      <HeaderCell Icon={Calendar} label="First Seen" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs text-muted-foreground">
        {formatCompactAgo(row.original.firstRedemption)}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'lastRedemption',
    header: () => (
      <HeaderCell Icon={Calendar} label="Last Active" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs text-muted-foreground">
        {formatCompactAgo(row.original.lastRedemption)}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
