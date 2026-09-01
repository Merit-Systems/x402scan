"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        <DataTableColumnHeader column={column} title="Server" />
      ),
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
        <DataTableColumnHeader column={column} title="Activity" />
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
        <DataTableColumnHeader column={column} title="Volume" />
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
        <DataTableColumnHeader column={column} title="Txns" />
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
        <DataTableColumnHeader column={column} title="Buyers" />
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
        <DataTableColumnHeader column={column} title="Latest" />
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
        <DataTableColumnHeader column={column} title="Chain" />
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
    {
      accessorKey: "tryIt",
      header: () => (
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href="https://agentcash.dev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Call all x402 resources with AgentCash"
                className="mx-auto flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            }
          >
            <Image
              src="/agentcash-light.svg"
              alt=""
              width={16}
              height={16}
              className="block size-4 dark:hidden"
            />
            <Image
              src="/agentcash-dark.svg"
              alt=""
              width={16}
              height={16}
              className="hidden size-4 dark:block"
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            Call all x402 resources with AgentCash.
          </TooltipContent>
        </Tooltip>
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const origin = row.original.origins[0]?.origin;
        if (!origin) return null;
        return <TryItButton origin={origin} />;
      },
      size: 90,
      meta: {
        loadingCell: <Skeleton className="mx-auto h-7 w-16 rounded-md" />,
      },
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

/**
 * Compact action button. Copies an AI agent prompt for the origin so users
 * can paste it into Claude/Cursor/etc. and discover the service interactively.
 * Tooltip explains what \"Try it\" actually does, since the affordance is
 * non-obvious.
 */
export const TryItButton: React.FC<{ origin: string }> = ({ origin }) => {
  const [copied, setCopied] = useState(false);
  const prompt = `Use the agentcash \`discover\` command to tell me what I can do with ${origin}. If you do not have agentcash tools or skills installed, go directly to agentcash.dev/skill.md and set it up.`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void navigator.clipboard.writeText(prompt).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="mx-auto"
          />
        }
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <ArrowUpRight className="size-3.5" />
        )}
        {copied ? "Copied" : "Try it"}
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p>
          {copied ? (
            "Prompt copied to clipboard."
          ) : (
            <>
              Copies an AI prompt to your clipboard. Paste into Claude, Cursor,
              or any agent that supports{" "}
              <span className="font-mono">agentcash</span> tools to explore this
              service.
            </>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
