'use client';

import { Wallet, DollarSign, Hash, Eye } from 'lucide-react';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { WalletSpendingSortingContext } from '@/app/_contexts/sorting/wallet-spending/context';
import { Copyable } from '@/components/ui/copyable';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/client';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';

type WalletSpending =
  RouterOutputs['admin']['spending']['byWallet']['items'][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
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

export const createColumns = (
  freeTierWalletAddress?: string
): ExtendedColumnDef<WalletSpending>[] => [
  {
    accessorKey: 'walletName',
    header: () => (
      <HeaderCell
        Icon={Wallet}
        label="Wallet"
        className="justify-start"
        sorting={{
          sortContext: WalletSpendingSortingContext,
          sortKey: 'walletName',
        }}
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
    accessorKey: 'totalToolCalls',
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="Tool Calls"
        className="mx-auto"
        sorting={{
          sortContext: WalletSpendingSortingContext,
          sortKey: 'totalToolCalls',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center text-xs font-mono">
        {row.original.totalToolCalls.toLocaleString()}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'uniqueResources',
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="Unique Tools"
        className="mx-auto"
        sorting={{
          sortContext: WalletSpendingSortingContext,
          sortKey: 'uniqueResources',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center text-xs font-mono">
        {row.original.uniqueResources}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'totalMaxAmount',
    header: () => (
      <HeaderCell
        Icon={DollarSign}
        label="Total Spend (USDC)"
        className="mx-auto"
        sorting={{
          sortContext: WalletSpendingSortingContext,
          sortKey: 'totalMaxAmount',
        }}
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
