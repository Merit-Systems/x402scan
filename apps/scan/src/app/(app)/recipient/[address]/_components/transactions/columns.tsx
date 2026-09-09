"use client";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { Address } from "@/components/ui/address";

import { cn, formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Chains } from "@/app/(app)/_components/chains";
import { Facilitator } from "@/app/(app)/_components/facilitator";

type ColumnType = RouterOutputs["public"]["transfers"]["list"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "sender",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Sender"
        className="text-left"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address address={row.original.sender} className="block text-left" />
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mr-auto h-4 w-16" /> },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Amount"
        className="justify-center text-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{formatTokenAmount(BigInt(row.original.amount))}</Cell>
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "block_timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Timestamp"
        className="justify-center text-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>{formatCompactAgo(row.original.block_timestamp)}</Cell>
    ),
    size: 150,
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
      <DataTableColumnHeader
        column={column}
        title="Facilitator"
        className="text-center"
      />
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
      <DataTableColumnHeader
        column={column}
        title="Transaction Hash"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address address={row.original.tx_hash} className="block text-center" />
    ),
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
];

export const overviewColumns = columns.map((column) => ({
  ...column,
  enableSorting: false,
}));

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
