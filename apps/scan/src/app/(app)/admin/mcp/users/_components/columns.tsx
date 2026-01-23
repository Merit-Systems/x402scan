'use client';

import {
  Calendar,
  DollarSign,
  Hash,
  ShoppingCart,
  Ticket,
  Wallet,
} from 'lucide-react';

import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCompactAgo, formatCurrency } from '@/lib/utils';
import { formatUnits } from 'viem';
import { convertTokenAmount } from '@/lib/token';
import { McpUsersSortingContext } from '@/app/(app)/_contexts/sorting/mcp-users';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import type { McpUserSortId } from '@/app/(app)/_contexts/sorting/mcp-users';

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
    accessorKey: 'inviteCodes',
    header: () => (
      <HeaderCell Icon={Ticket} label="Invite Code" className="justify-start" />
    ),
    cell: ({ row }) => {
      const codes = row.original.inviteCodes;
      if (!codes || codes.length === 0) {
        return <div className="text-xs text-muted-foreground">—</div>;
      }

      const firstCode = codes[0];
      const remaining = codes.length - 1;

      if (remaining === 0) {
        return (
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {firstCode}
          </code>
        );
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs font-mono">
              <code className="bg-muted px-2 py-1 rounded">{firstCode}</code>
              <span className="text-muted-foreground ml-1">+{remaining}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {codes.map(code => (
                <code key={code} className="block text-xs font-mono">
                  {code}
                </code>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
    size: 140,
    loading: () => <Skeleton className="h-4 w-20" />,
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
      <HeaderCell<McpUserSortId>
        Icon={DollarSign}
        label="Total Received"
        className="mx-auto"
        sorting={{
          sortContext: McpUsersSortingContext,
          sortKey: 'totalAmount',
        }}
      />
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
    accessorKey: 'totalSpent',
    header: () => (
      <HeaderCell<McpUserSortId>
        Icon={ShoppingCart}
        label="Total Spent"
        className="mx-auto"
        sorting={{
          sortContext: McpUsersSortingContext,
          sortKey: 'totalSpent',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCurrency(
          convertTokenAmount(BigInt(Math.round(row.original.totalSpent)))
        )}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'transactionCount',
    header: () => (
      <HeaderCell<McpUserSortId>
        Icon={Hash}
        label="Txs (Buyer)"
        className="mx-auto"
        sorting={{
          sortContext: McpUsersSortingContext,
          sortKey: 'transactionCount',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.transactionCount.toLocaleString()}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-12 mx-auto" />,
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
      <HeaderCell<McpUserSortId>
        Icon={Calendar}
        label="Last Active"
        className="mx-auto"
        sorting={{
          sortContext: McpUsersSortingContext,
          sortKey: 'lastRedemption',
        }}
      />
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
