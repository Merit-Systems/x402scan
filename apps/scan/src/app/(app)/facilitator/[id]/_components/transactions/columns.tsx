"use client";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Address } from "@/components/ui/address";

import { Seller, SellerSkeleton } from "@/app/(app)/_components/seller";

import { formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { RouterOutputs } from "@/trpc/client";
import type { DataTableColumnDef } from "@/components/ui/data-table";

type ColumnType = RouterOutputs["public"]["transfers"]["list"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "recipient",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Server" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Seller
        address={row.original.recipient}
        addressClassName="text-xs font-normal"
      />
    ),
    size: 300, // Fixed width for seller column (widest for address display)
    meta: { loadingCell: <SellerSkeleton /> },
  },
  {
    accessorKey: "sender",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sender" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address
        address={row.original.sender}
        className="block text-center text-xs"
      />
    ),
    size: 200,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "transaction_hash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hash" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address
        address={row.original.tx_hash}
        className="block text-center text-xs"
        disableCopy
        hideTooltip
      />
    ),
    size: 200,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "block_timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.block_timestamp)}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.amount))}
      </div>
    ),
    size: 150, // Fixed width for buyers count
    meta: { loadingCell: <Skeleton className="ml-auto h-4 w-16" /> },
  },
];

export const overviewColumns = columns.map((column) => ({
  ...column,
  enableSorting: false,
}));
