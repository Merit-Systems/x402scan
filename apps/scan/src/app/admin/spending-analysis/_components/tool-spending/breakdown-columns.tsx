import { Globe, Hash, DollarSign, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import type { ToolBreakdownSortId } from '@/services/db/spending/by-wallet';
import type { LucideIcon } from 'lucide-react';

type ToolBreakdown =
  RouterOutputs['admin']['spending']['toolBreakdown'][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
};

interface SortableHeaderProps {
  Icon: LucideIcon;
  label: string;
  className?: string;
  sortId: ToolBreakdownSortId;
  currentSort: { id: ToolBreakdownSortId; desc: boolean };
  onSort: (id: ToolBreakdownSortId) => void;
}

const SortableHeader = ({
  Icon,
  label,
  className,
  sortId,
  currentSort,
  onSort,
}: SortableHeaderProps) => {
  const isSorted = currentSort.id === sortId;
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 text-sm text-muted-foreground w-fit cursor-pointer hover:bg-accent rounded-md transition-all',
        className
      )}
      onClick={() => onSort(sortId)}
    >
      <Icon className="size-3" />
      {label}
      {isSorted ? (
        currentSort.desc ? (
          <ArrowDown className="size-3" />
        ) : (
          <ArrowUp className="size-3" />
        )
      ) : null}
    </div>
  );
};

export const createToolBreakdownColumns = (
  sorting: { id: ToolBreakdownSortId; desc: boolean },
  setSorting: (sorting: { id: ToolBreakdownSortId; desc: boolean }) => void
): ExtendedColumnDef<ToolBreakdown>[] => {
  const handleSort = (id: ToolBreakdownSortId) => {
    setSorting({
      id,
      desc: sorting.id === id ? !sorting.desc : true,
    });
  };

  return [
    {
      accessorKey: 'resourceUrl',
      header: () => (
        <SortableHeader
          Icon={Globe}
          label="Tool"
          className="justify-start"
          sortId="resourceUrl"
          currentSort={sorting}
          onSort={handleSort}
        />
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
        <SortableHeader
          Icon={Hash}
          label="Calls"
          className="mx-auto"
          sortId="toolCalls"
          currentSort={sorting}
          onSort={handleSort}
        />
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
        <SortableHeader
          Icon={DollarSign}
          label="Per Call (USDC)"
          className="mx-auto"
          sortId="maxAmountPerCall"
          currentSort={sorting}
          onSort={handleSort}
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
        <SortableHeader
          Icon={DollarSign}
          label="Total (USDC)"
          className="mx-auto"
          sortId="totalMaxAmount"
          currentSort={sorting}
          onSort={handleSort}
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
