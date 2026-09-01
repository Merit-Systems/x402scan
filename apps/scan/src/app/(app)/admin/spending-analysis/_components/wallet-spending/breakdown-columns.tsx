"use client";

import { Wallet, Hash, DollarSign, Clock, Eye } from "lucide-react";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Copyable } from "@/components/ui/copyable";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/client";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { HeaderCell } from "@/app/(app)/admin/_components/data-table-header-cell";

type WalletBreakdown =
  RouterOutputs["admin"]["spending"]["walletBreakdown"][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
};

const formatDate = (date: Date | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
          className="block max-w-[200px] truncate font-mono text-xs font-medium"
        >
          {address}
        </Copyable>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[150px] truncate text-xs font-medium">
        {isFreeTier ? "Free Tier" : walletName}
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

export const createWalletBreakdownColumns = (
  freeTierWalletAddress?: string
): DataTableColumnDef<WalletBreakdown>[] => {
  return [
    {
      accessorKey: "walletName",
      header: () => (
        <HeaderCell Icon={Wallet} label="Wallet" className="justify-start" />
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
      meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
    },
    {
      accessorKey: "toolCalls",
      header: () => (
        <HeaderCell Icon={Hash} label="Calls" className="mx-auto" />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs">
          {row.original.toolCalls.toLocaleString()}
        </div>
      ),
      size: 100,
      meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
    },
    {
      accessorKey: "maxAmountPerCall",
      header: () => (
        <HeaderCell
          Icon={DollarSign}
          label="Per Call (USDC)"
          className="mx-auto"
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs">
          {formatAmount(row.original.maxAmountPerCall)}
        </div>
      ),
      size: 150,
      meta: { loadingCell: <Skeleton className="mx-auto h-4 w-20" /> },
    },
    {
      accessorKey: "totalMaxAmount",
      header: () => (
        <HeaderCell
          Icon={DollarSign}
          label="Total (USDC)"
          className="mx-auto"
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs font-medium">
          {formatAmount(row.original.totalMaxAmount)}
        </div>
      ),
      size: 150,
      meta: { loadingCell: <Skeleton className="mx-auto h-4 w-20" /> },
    },
    {
      accessorKey: "lastUsedAt",
      header: () => (
        <HeaderCell Icon={Clock} label="Last Used" className="mx-auto" />
      ),
      cell: ({ row }) => (
        <div className="text-center text-xs text-muted-foreground">
          {formatDate(row.original.lastUsedAt)}
        </div>
      ),
      size: 150,
      meta: { loadingCell: <Skeleton className="mx-auto h-4 w-24" /> },
    },
  ];
};
