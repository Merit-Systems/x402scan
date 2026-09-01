"use client";

import { Globe, Hash, DollarSign, Wallet, Clock } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderCell } from "@/app/(app)/admin/_components/data-table-header-cell";
import { ToolSpendingSortingContext } from "@/app/(app)/admin/_contexts/sorting/tool-spending/context";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type ToolSpending =
  RouterOutputs["admin"]["spending"]["byTool"]["items"][number];

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

export const createToolSpendingColumns =
  (): DataTableColumnDef<ToolSpending>[] => [
    {
      accessorKey: "resourceUrl",
      header: () => (
        <HeaderCell
          Icon={Globe}
          label="Tool"
          className="justify-start"
          sorting={{
            sortContext: ToolSpendingSortingContext,
            sortKey: "resourceUrl",
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-xs font-medium">
          {row.original.resourceUrl}
        </div>
      ),
      size: 300,
      meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
    },
    {
      accessorKey: "totalToolCalls",
      header: () => (
        <HeaderCell
          Icon={Hash}
          label="Total Calls"
          className="mx-auto"
          sorting={{
            sortContext: ToolSpendingSortingContext,
            sortKey: "totalToolCalls",
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs">
          {row.original.totalToolCalls.toLocaleString()}
        </div>
      ),
      size: 120,
      meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
    },
    {
      accessorKey: "uniqueWallets",
      header: () => (
        <HeaderCell
          Icon={Wallet}
          label="Wallets"
          className="mx-auto"
          sorting={{
            sortContext: ToolSpendingSortingContext,
            sortKey: "uniqueWallets",
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs">
          {row.original.uniqueWallets}
        </div>
      ),
      size: 100,
      meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
    },
    {
      accessorKey: "totalMaxAmount",
      header: () => (
        <HeaderCell
          Icon={DollarSign}
          label="Total Spend (USDC)"
          className="mx-auto"
          sorting={{
            sortContext: ToolSpendingSortingContext,
            sortKey: "totalMaxAmount",
          }}
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
        <HeaderCell
          Icon={Clock}
          label="Last Used"
          className="mx-auto"
          sorting={{
            sortContext: ToolSpendingSortingContext,
            sortKey: "lastUsedAt",
          }}
        />
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
