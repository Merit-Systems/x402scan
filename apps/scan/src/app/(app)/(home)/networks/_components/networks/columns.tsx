"use client";

import Image from "next/image";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type ColumnType = RouterOutputs["networks"]["list"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "chain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Network" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Image
          src={row.original.icon}
          alt={row.original.label}
          width={16}
          height={16}
          className="rounded-md"
        />
        <p className="text-xs font-semibold">{row.original.label}</p>
      </div>
    ),
    size: 200,
    meta: {
      loadingCell: (
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 w-20" />
        </div>
      ),
    },
  },
  {
    accessorKey: "transactions",
    id: "tx_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transactions" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.tx_count.toLocaleString()}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "volume",
    id: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Volume" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "facilitators",
    id: "unique_facilitators",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Facilitators" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_facilitators.toLocaleString()}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "sellers",
    id: "unique_sellers",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sellers" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_sellers.toLocaleString()}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "buyers",
    id: "unique_buyers",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Buyers" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_buyers.toLocaleString()}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "latest_block_timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {row.original.latest_block_timestamp
          ? formatCompactAgo(row.original.latest_block_timestamp)
          : "–"}
      </div>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="ml-auto h-4 w-16" /> },
  },
];
