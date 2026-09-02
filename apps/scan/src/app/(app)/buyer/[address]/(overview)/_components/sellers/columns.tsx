"use client";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { SellerChart, LoadingSellerChart } from "./chart";

import { Seller, SellerSkeleton } from "@/app/(app)/_components/seller";
import { Facilitators } from "@/app/(app)/_components/facilitator";

import { cn, formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Chains } from "@/app/(app)/_components/chains";

type ColumnType =
  RouterOutputs["public"]["buyers"]["all"]["sellers"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "recipient",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Server"
        className="text-left"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Seller
        address={row.original.recipient}
        disableCopy
        addressClassName="font-normal"
      />
    ),
    size: 225,
    meta: { loadingCell: <SellerSkeleton /> },
  },
  {
    accessorKey: "chart",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Activity"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => <SellerChart addresses={[row.original.recipient]} />,
    size: 100,
    meta: { loadingCell: <LoadingSellerChart /> },
  },
  {
    accessorKey: "tx_count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Txns"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Cell>
        {row.original.tx_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </Cell>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Volume"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Cell>
        {formatTokenAmount(BigInt(Math.round(row.original.total_amount)))}
      </Cell>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "latest_block_timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Latest"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Cell>
        {row.original.latest_block_timestamp
          ? formatCompactAgo(row.original.latest_block_timestamp)
          : "–"}
      </Cell>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "chains",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Chain"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Chains
        chains={row.original.chains}
        iconClassName="size-4"
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto size-4" /> },
  },
  {
    accessorKey: "facilitator_ids",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Facilitator"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Facilitators
        ids={row.original.facilitator_ids}
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
];

const Cell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("text-center type-caption", className)}>{children}</div>
  );
};
