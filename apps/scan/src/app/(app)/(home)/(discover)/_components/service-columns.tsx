"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Sparkline, SparklineLoading } from "@/components/ui/sparkline";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";

import { cn, formatCompactAgo } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Chains } from "@/app/(app)/_components/chains";

type BazaarItem =
  RouterOutputs["public"]["sellers"]["bazaar"]["list"]["items"][number];

export type ServiceItem = BazaarItem;

export const serviceColumns: DataTableColumnDef<ServiceItem>[] = [
  {
    id: "editorial",
    accessorKey: "recipients",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Server"
        className="justify-start"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex h-13 items-center pr-4">
        <ServiceSummary item={row.original} />
      </div>
    ),
    size: 400,
    meta: {
      loadingCell: <LoadingServiceSummary className="h-13 pr-4" />,
    },
  },
  {
    accessorKey: "chart",
    header: () => null,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="h-5">
        <Sparkline
          className="h-full"
          values={row.original.transactionSparkline}
        />
      </div>
    ),
    size: 64,
    meta: {
      loadingCell: (
        <div className="h-5">
          <SparklineLoading className="h-full" />
        </div>
      ),
    },
  },
  {
    accessorKey: "total_amount",
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
    size: 110,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "tx_count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Txns"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>
        {row.original.tx_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </Cell>
    ),
    size: 90,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-12" /> },
  },
  {
    accessorKey: "unique_buyers",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Buyers"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>
        {row.original.unique_buyers.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </Cell>
    ),
    size: 90,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-12" /> },
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
    size: 90,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-12" /> },
  },
  {
    accessorKey: "chains",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Chain"
        className="justify-center"
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
    size: 70,
    meta: { loadingCell: <Skeleton className="mx-auto size-4" /> },
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
