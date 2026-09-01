import { Globe, Hash, DollarSign } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import type { ExtendedColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { HeaderCell } from "@/components/ui/data-table/header-cell";

type ToolBreakdown =
  RouterOutputs["admin"]["spending"]["toolBreakdown"][number];

const formatAmount = (amount: string) => {
  const numericAmount = BigInt(amount);
  return (Number(numericAmount) / 1e6).toFixed(6);
};

export const createToolBreakdownColumns =
  (): ExtendedColumnDef<ToolBreakdown>[] => {
    return [
      {
        accessorKey: "resourceUrl",
        header: () => (
          <HeaderCell Icon={Globe} label="Tool" className="justify-start" />
        ),
        cell: ({ row }) => (
          <div className="max-w-[400px] truncate text-xs font-medium">
            {row.original.resourceUrl}
          </div>
        ),
        size: 400,
        loading: () => <Skeleton className="h-4 w-full" />,
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
        loading: () => <Skeleton className="mx-auto h-4 w-16" />,
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
        loading: () => <Skeleton className="mx-auto h-4 w-20" />,
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
        loading: () => <Skeleton className="mx-auto h-4 w-20" />,
      },
    ];
  };
