"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Sparkline, SparklineLoading } from "@/components/ui/sparkline";

import { Favicon } from "@/app/(app)/_components/favicon";

import {
  cn,
  cleanExternalText,
  truncateAtDelimiter,
  formatCompactAgo,
} from "@/lib/utils";
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
        className="flex justify-start type-caption"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => <ServiceSummary item={row.original} />,
    size: 280,
    meta: {
      loadingCell: (
        <div className="flex items-start gap-2.5">
          <Skeleton className="mt-0.5 size-6 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5 py-0.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      ),
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
        className="flex justify-center type-caption"
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

/**
 * Server cell — title (curated) + description on top, hostname tucked
 * underneath in mono. Falls back to hostname-as-title when no curated title
 * exists.
 */
export const ServiceSummary: React.FC<{
  item: ServiceItem;
}> = ({ item }) => {
  const origin = item.origins[0];
  if (!origin) return null;

  const hostname = new URL(origin.origin).hostname;
  const rawTitle = origin.title?.trim();
  const cleanTitle = rawTitle ? cleanExternalText(rawTitle) : hostname;
  const title = truncateAtDelimiter(cleanTitle);
  const rawDescription = origin.description?.trim();
  const description = rawDescription ? cleanExternalText(rawDescription) : null;
  const otherOrigins = item.origins.slice(1);

  const innerContent = (
    <>
      <Favicon url={origin.favicon} className="mt-0.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate type-label transition-colors group-hover:text-primary">
            {title}
          </span>
          {otherOrigins.length > 0 ? (
            <span className="shrink-0 type-caption text-muted-foreground">
              +{otherOrigins.length}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate type-caption text-muted-foreground">
          {description ?? "No description available."}
        </div>
        <span className="type-compact-code mt-0.5 block truncate text-muted-foreground/70">
          {hostname}
        </span>
      </div>
    </>
  );

  return (
    <Link
      href={`/server/${origin.id}`}
      className="group flex min-w-0 items-start gap-2.5 py-0.5"
    >
      {innerContent}
    </Link>
  );
};
