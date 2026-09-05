import { Globe, Hash, DollarSign } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { HeaderCell } from "@/app/(app)/admin/_components/data-table-header-cell";

type ToolBreakdown =
  RouterOutputs["admin"]["spending"]["toolBreakdown"][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
};

export const createToolBreakdownColumns =
  (): DataTableColumnDef<ToolBreakdown>[] => {
    return [
      {
        accessorKey: "resourceUrl",
        header: () => (
          <HeaderCell Icon={Globe} label="Tool" className="justify-start" />
        ),
        cell: ({ row }) => (
          <div className="type-emphasis max-w-[400px] truncate type-caption">
            {row.original.resourceUrl}
          </div>
        ),
        size: 400,
        meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
      },
      {
        accessorKey: "toolCalls",
        header: () => (
          <HeaderCell Icon={Hash} label="Calls" className="mx-auto" />
        ),
        cell: ({ row }) => (
          <div className="type-mono type-scale-caption text-center">
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
          <div className="type-mono type-scale-caption text-center">
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
          <div className="type-mono type-emphasis type-scale-caption text-center">
            {formatAmount(row.original.totalMaxAmount)}
          </div>
        ),
        size: 150,
        meta: { loadingCell: <Skeleton className="mx-auto h-4 w-20" /> },
      },
    ];
  };
