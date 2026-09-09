"use client";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Address } from "@/components/ui/address";

import { Seller, SellerSkeleton } from "@/app/(app)/_components/seller";

import { cn, formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { RouterOutputs } from "@/trpc/client";
import type { DataTableColumnDef } from "@/components/ui/data-table";

type ColumnType = RouterOutputs["public"]["transfers"]["list"]["items"][number];

const columns: DataTableColumnDef<ColumnType>[] = [
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
      <Seller address={row.original.recipient} addressClassName="font-normal" />
    ),
    size: 300,
    meta: { loadingCell: <SellerSkeleton /> },
  },
  {
    accessorKey: "sender",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Sender"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address address={row.original.sender} className="block text-center" />
    ),
    size: 200,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "transaction_hash",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Hash"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Address
        address={row.original.tx_hash}
        className="block text-center"
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
