"use client";

import Image from "next/image";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { cn, formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type ColumnType = RouterOutputs["networks"]["list"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "chain",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Network"
        className="text-left"
      />
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
        <p className="type-label">{row.original.label}</p>
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
      <DataTableColumnHeader
        column={column}
        title="Transactions"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => <Cell>{row.original.tx_count.toLocaleString()}</Cell>,
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "volume",
    id: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Volume"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{formatTokenAmount(BigInt(row.original.total_amount))}</Cell>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "facilitators",
    id: "unique_facilitators",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Facilitators"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{row.original.unique_facilitators.toLocaleString()}</Cell>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "sellers",
    id: "unique_sellers",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Sellers"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{row.original.unique_sellers.toLocaleString()}</Cell>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "buyers",
    id: "unique_buyers",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Buyers"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{row.original.unique_buyers.toLocaleString()}</Cell>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "latest_block_timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Latest"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{formatCompactAgo(row.original.latest_block_timestamp)}</Cell>
    ),
    size: 150,
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
