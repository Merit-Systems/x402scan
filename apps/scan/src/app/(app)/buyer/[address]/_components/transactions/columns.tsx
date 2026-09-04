"use client";

import Link from "next/link";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { Address } from "@/components/ui/address";

import { formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Chains } from "@/app/(app)/_components/chains";
import { Facilitator } from "@/app/(app)/_components/facilitator";

type ColumnType = RouterOutputs["public"]["transfers"]["list"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "recipient",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recipient" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Link href={`/recipient/${row.original.recipient}`}>
        <Address
          address={row.original.recipient}
          disableCopy
          className="block text-left text-xs hover:underline"
        />
      </Link>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mr-auto h-4 w-16" /> },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.amount))}
      </div>
    ),
    size: 150,
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
    accessorKey: "chains",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Chain" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Chains
        chains={[row.original.chain]}
        iconClassName="size-4"
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto size-4" /> },
  },
  {
    accessorKey: "facilitator",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Facilitator" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Facilitator
        id={row.original.facilitator_id}
        className="mx-auto justify-center"
      />
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "transaction_hash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Hash" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address
        address={row.original.tx_hash}
        className="block text-center text-xs"
      />
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
];

export const overviewColumns = columns.map((column) => ({
  ...column,
  enableSorting: false,
}));
