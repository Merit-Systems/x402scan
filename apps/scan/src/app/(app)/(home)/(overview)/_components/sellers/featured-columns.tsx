"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/ui/data-table";

import {
  KnownSellerChart,
  LoadingKnownSellerChart,
} from "./known-sellers/chart";

import { Favicon } from "@/app/(app)/_components/favicon";

import {
  cleanExternalText,
  truncateAtDelimiter,
  formatCompactAgo,
} from "@/lib/utils";
import { formatTokenAmount } from "@/lib/token";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Chains } from "@/app/(app)/_components/chains";

import type { SearchResultEndpoint } from "@/lib/discover/search";

type BazaarItem =
  RouterOutputs["public"]["sellers"]["bazaar"]["list"]["items"][number];

export type FeaturedServiceItem = BazaarItem & {
  searchEndpoint?: SearchResultEndpoint;
};

export const featuredServiceColumns: DataTableColumnDef<FeaturedServiceItem>[] =
  [
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
      cell: ({ row }) => <FeaturedServiceSummary item={row.original} />,
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Activity"
          className="justify-center"
        />
      ),
      enableSorting: false,
      cell: ({ row }) =>
        row.original.recipients.length > 0 ? (
          <KnownSellerChart addresses={row.original.recipients} />
        ) : (
          <div className="h-[32px]" />
        ),
      size: 200,
      meta: { loadingCell: <LoadingKnownSellerChart /> },
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
      // Volume is the primary economic signal — bigger, bolder, foreground color.
      cell: ({ row }) => (
        <div className="type-numeric type-supporting-body type-emphasis text-center">
          {formatTokenAmount(BigInt(row.original.total_amount))}
        </div>
      ),
      size: 110,
      meta: { loadingCell: <Skeleton className="mx-auto h-5 w-16" /> },
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
        <div className="type-numeric text-center type-caption text-muted-foreground">
          {row.original.tx_count.toLocaleString(undefined, {
            notation: "compact",
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          })}
        </div>
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
        <div className="type-numeric text-center type-caption text-muted-foreground">
          {row.original.unique_buyers.toLocaleString(undefined, {
            notation: "compact",
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          })}
        </div>
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
        <div className="type-numeric text-center type-caption text-muted-foreground">
          {row.original.latest_block_timestamp
            ? formatCompactAgo(row.original.latest_block_timestamp)
            : "–"}
        </div>
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

/**
 * Server cell — title (curated) + description on top, hostname tucked
 * underneath in mono. Falls back to hostname-as-title when no curated title
 * exists.
 */
export const FeaturedServiceSummary: React.FC<{
  item: FeaturedServiceItem;
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

  // Stub rows from search results have id === origin URL (no x402scan record
  // exists yet). Linking to /server/<url> 404s, so jump out to the origin.
  const isExternal = origin.id.startsWith("http");
  const innerContent = (
    <>
      <Favicon url={origin.favicon} className="mt-0.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate type-label transition-colors group-hover:text-primary">
            {title}
          </span>
          {isExternal ? (
            <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
          ) : null}
          {otherOrigins.length > 0 ? (
            <span className="shrink-0 type-caption text-muted-foreground">
              +{otherOrigins.length}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate type-caption text-muted-foreground">
          {description ?? "No description available."}
        </div>
        <div className="type-compact-code mt-0.5 truncate text-muted-foreground/70">
          {hostname}
        </div>
      </div>
    </>
  );

  return isExternal ? (
    <a
      href={origin.origin}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-start gap-2.5 py-0.5"
    >
      {innerContent}
    </a>
  ) : (
    <Link
      href={`/server/${origin.id}`}
      className="group flex min-w-0 items-start gap-2.5 py-0.5"
    >
      {innerContent}
    </Link>
  );
};
