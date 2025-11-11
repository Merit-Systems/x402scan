import { Globe, Hash, DollarSign } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { HeaderCell } from '@/components/ui/data-table/header-cell';

type ToolBreakdown =
  RouterOutputs['admin']['spending']['toolBreakdown'][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
};

export const createToolBreakdownColumns =
  (): ExtendedColumnDef<ToolBreakdown>[] => {
    return [
      {
        accessorKey: 'resourceUrl',
        header: () => (
          <HeaderCell Icon={Globe} label="Tool" className="justify-start" />
        ),
        cell: ({ row }) => (
          <div className="text-xs font-medium truncate max-w-[400px]">
            {row.original.resourceUrl}
          </div>
        ),
        size: 400,
        loading: () => <Skeleton className="h-4 w-full" />,
      },
      {
        accessorKey: 'toolCalls',
        header: () => (
          <HeaderCell Icon={Hash} label="Calls" className="mx-auto" />
        ),
        cell: ({ row }) => (
          <div className="text-center text-xs font-mono">
            {row.original.toolCalls.toLocaleString()}
          </div>
        ),
        size: 100,
        loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
      },
      {
        accessorKey: 'maxAmountPerCall',
        header: () => (
          <HeaderCell
            Icon={DollarSign}
            label="Per Call (USDC)"
            className="mx-auto"
          />
        ),
        cell: ({ row }) => (
          <div className="text-center text-xs font-mono">
            {formatAmount(row.original.maxAmountPerCall)}
          </div>
        ),
        size: 150,
        loading: () => <Skeleton className="h-4 w-20 mx-auto" />,
      },
      {
        accessorKey: 'totalMaxAmount',
        header: () => (
          <HeaderCell
            Icon={DollarSign}
            label="Total (USDC)"
            className="mx-auto"
          />
        ),
        cell: ({ row }) => (
          <div className="text-center text-xs font-mono font-medium">
            {formatAmount(row.original.totalMaxAmount)}
          </div>
        ),
        size: 150,
        loading: () => <Skeleton className="h-4 w-20 mx-auto" />,
      },
    ];
  };
