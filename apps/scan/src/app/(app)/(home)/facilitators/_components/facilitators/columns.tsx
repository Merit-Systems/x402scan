"use client";

import Link from "next/link";
import Image from "next/image";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { cn, formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Chains } from "@/app/(app)/_components/chains";

type ColumnType =
  RouterOutputs["public"]["facilitators"]["list"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "facilitator_name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Facilitator"
        className="text-left"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/facilitator/${row.original.facilitator_id}`}
        className="flex items-center gap-1"
      >
        <Image
          src={row.original.facilitator.image}
          alt={row.original.facilitator.name}
          width={16}
          height={16}
          className="rounded-md"
        />
        <p className="type-label">{row.original.facilitator.name}</p>
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: row.original.facilitator.color }}
        />
      </Link>
    ),
    size: 250,
    meta: {
      loadingCell: (
        <div className="flex items-center gap-1">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="size-2 rounded-full" />
        </div>
      ),
    },
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
      <Cell>
        {row.original.latest_block_timestamp
          ? formatCompactAgo(row.original.latest_block_timestamp)
          : "–"}
      </Cell>
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
