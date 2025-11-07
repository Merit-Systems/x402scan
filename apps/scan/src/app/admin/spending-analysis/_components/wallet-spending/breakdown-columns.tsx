'use client';

import {
  Wallet,
  Hash,
  DollarSign,
  Clock,
  ArrowDown,
  ArrowUp,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Copyable } from '@/components/ui/copyable';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/client';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import type { WalletBreakdownSortId } from '@/services/db/spending/by-tool';
import type { LucideIcon } from 'lucide-react';

type WalletBreakdown =
  RouterOutputs['admin']['spending']['walletBreakdown'][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
};

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WalletCell = ({
  walletName,
  isFreeTier,
}: {
  walletName: string;
  isFreeTier: boolean;
}) => {
  const [showAddress, setShowAddress] = useState(false);
  const { data: address, isLoading } =
    api.admin.spending.getWalletAddress.useQuery(
      { walletName },
      { enabled: showAddress }
    );

  if (showAddress && address) {
    return (
      <div className="flex items-center gap-2">
        {isFreeTier && <span className="text-xs font-medium">Free Tier -</span>}
        <Copyable
          value={address}
          toastMessage="Wallet address copied"
          className="text-xs font-mono font-medium truncate max-w-[200px] block"
        >
          {address}
        </Copyable>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium truncate max-w-[150px]">
        {isFreeTier ? 'Free Tier' : walletName}
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2"
        onClick={() => setShowAddress(true)}
        disabled={isLoading}
      >
        <Eye className="size-3" />
      </Button>
    </div>
  );
};

interface SortableHeaderProps {
  Icon: LucideIcon;
  label: string;
  className?: string;
  sortId: WalletBreakdownSortId;
  currentSort: { id: WalletBreakdownSortId; desc: boolean };
  onSort: (id: WalletBreakdownSortId) => void;
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

export const createWalletBreakdownColumns = (
  sorting: { id: WalletBreakdownSortId; desc: boolean },
  setSorting: (sorting: { id: WalletBreakdownSortId; desc: boolean }) => void,
  freeTierWalletAddress?: string
): ExtendedColumnDef<WalletBreakdown>[] => {
  const handleSort = (id: WalletBreakdownSortId) => {
    setSorting({
      id,
      desc: sorting.id === id ? !sorting.desc : true,
    });
  };

  return [
    {
      accessorKey: 'walletName',
      header: () => (
        <SortableHeader
          Icon={Wallet}
          label="Wallet"
          className="justify-start"
          sortId="walletName"
          currentSort={sorting}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => {
        const isFreeTier = Boolean(
          freeTierWalletAddress &&
            row.original.walletName.toLowerCase() ===
              freeTierWalletAddress.toLowerCase()
        );

        return (
          <WalletCell
            walletName={row.original.walletName}
            isFreeTier={isFreeTier}
          />
        );
      },
      size: 200,
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
    {
      accessorKey: 'lastUsedAt',
      header: () => (
        <SortableHeader
          Icon={Clock}
          label="Last Used"
          className="mx-auto"
          sortId="lastUsedAt"
          currentSort={sorting}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => (
        <div className="text-center text-xs text-muted-foreground">
          {formatDate(row.original.lastUsedAt)}
        </div>
      ),
      size: 150,
      loading: () => <Skeleton className="h-4 w-24 mx-auto" />,
    },
  ];
};
