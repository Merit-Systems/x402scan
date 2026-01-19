'use client';

import { Hash, Calendar, User, DollarSign, MoreHorizontal } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCompactAgo, formatCurrency } from '@/lib/utils';
import { formatUnits } from 'viem';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';

type ColumnType = RouterOutputs['admin']['inviteCodes']['list'][number];

interface ColumnHandlers {
  onDisable?: (id: string) => void;
  onReactivate?: (id: string) => void;
}

const getStatusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'EXHAUSTED':
      return 'secondary';
    case 'EXPIRED':
      return 'outline';
    case 'DISABLED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const createColumns = (
  handlers?: ColumnHandlers
): ExtendedColumnDef<ColumnType>[] => [
  {
    accessorKey: 'code',
    header: () => (
      <HeaderCell Icon={Hash} label="Code" className="justify-start" />
    ),
    cell: ({ row }) => (
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
        {row.original.code}
      </code>
    ),
    size: 150,
    loading: () => <Skeleton className="h-4 w-24" />,
  },
  {
    accessorKey: 'amount',
    header: () => (
      <HeaderCell Icon={DollarSign} label="Amount" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCurrency(parseFloat(formatUnits(row.original.amount, 6)))}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'redemptions',
    header: () => (
      <HeaderCell Icon={Hash} label="Redemptions" className="mx-auto" />
    ),
    cell: ({ row }) => {
      const { redemptionCount, maxRedemptions } = row.original;
      const text =
        maxRedemptions === 0
          ? `${redemptionCount} / ∞`
          : `${redemptionCount} / ${maxRedemptions}`;
      return <div className="text-center font-mono text-xs">{text}</div>;
    },
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'status',
    header: () => (
      <HeaderCell Icon={Hash} label="Status" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'uniqueRecipients',
    header: () => (
      <HeaderCell Icon={User} label="Unique Only" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center text-xs">
        {row.original.uniqueRecipients ? 'Yes' : 'No'}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-12 mx-auto" />,
  },
  {
    accessorKey: 'createdBy',
    header: () => (
      <HeaderCell Icon={User} label="Created By" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center text-xs text-muted-foreground truncate max-w-[120px]">
        {row.original.createdBy.email || row.original.createdBy.name || 'N/A'}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-20 mx-auto" />,
  },
  {
    accessorKey: 'expiresAt',
    header: () => (
      <HeaderCell Icon={Calendar} label="Expires" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.expiresAt
          ? formatCompactAgo(row.original.expiresAt)
          : 'Never'}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'createdAt',
    header: () => (
      <HeaderCell Icon={Calendar} label="Created" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.createdAt)}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const { status, id } = row.original;
      const canDisable = status === 'ACTIVE';
      const canReactivate =
        status === 'DISABLED' || status === 'EXPIRED';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canDisable && (
              <DropdownMenuItem
                onClick={() => handlers?.onDisable?.(id)}
                className="text-destructive"
              >
                Disable
              </DropdownMenuItem>
            )}
            {canReactivate && (
              <DropdownMenuItem onClick={() => handlers?.onReactivate?.(id)}>
                Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(row.original.code)}
            >
              Copy Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 50,
  },
];
