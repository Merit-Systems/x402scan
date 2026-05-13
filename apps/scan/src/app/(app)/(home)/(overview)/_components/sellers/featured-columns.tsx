'use client';

import {
  Activity,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Check,
  DollarSign,
  Globe,
  Server,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  KnownSellerChart,
  LoadingKnownSellerChart,
} from './known-sellers/chart';

import { Favicon } from '@/app/(app)/_components/favicon';

import {
  cleanExternalText,
  formatAddress,
  formatCompactAgo,
} from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Chains } from '@/app/(app)/_components/chains';
import { SellersSortingContext } from '@/app/(app)/_contexts/sorting/sellers/context';

import type { SearchResultEndpoint } from '@/lib/discover/search';

type BazaarItem =
  RouterOutputs['public']['sellers']['bazaar']['list']['items'][number];

export type FeaturedServiceItem = BazaarItem & {
  searchEndpoint?: SearchResultEndpoint;
};

export const featuredServiceColumns: ExtendedColumnDef<FeaturedServiceItem>[] =
  [
    {
      accessorKey: 'recipients',
      header: () => (
        <HeaderCell
          Icon={Server}
          label="Server"
          className="mr-auto"
          sorting={{
            sortContext: SellersSortingContext,
            sortKey: 'editorial',
          }}
        />
      ),
      cell: ({ row }) => <ServerCell item={row.original} />,
      size: 280,
      loading: () => (
        <div className="flex items-start gap-2.5">
          <Skeleton className="size-6 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5 py-0.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'chart',
      header: () => (
        <HeaderCell Icon={Activity} label="Activity" className="mx-auto" />
      ),
      cell: ({ row }) =>
        row.original.recipients.length > 0 ? (
          <KnownSellerChart addresses={row.original.recipients} />
        ) : (
          <div className="h-[32px]" />
        ),
      size: 200,
      loading: () => <LoadingKnownSellerChart />,
    },
    {
      accessorKey: 'total_amount',
      header: () => (
        <HeaderCell
          Icon={DollarSign}
          label="Volume"
          className="mx-auto"
          sorting={{
            sortContext: SellersSortingContext,
            sortKey: 'total_amount',
          }}
        />
      ),
      // Volume is the primary economic signal — bigger, bolder, foreground color.
      cell: ({ row }) => (
        <div className="text-center font-mono text-sm font-semibold tabular-nums">
          {formatTokenAmount(BigInt(row.original.total_amount))}
        </div>
      ),
      size: 110,
      loading: () => <Skeleton className="h-5 w-16 mx-auto" />,
    },
    {
      accessorKey: 'tx_count',
      header: () => (
        <HeaderCell
          Icon={ArrowLeftRight}
          label="Txns"
          className="mx-auto"
          sorting={{
            sortContext: SellersSortingContext,
            sortKey: 'tx_count',
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-muted-foreground tabular-nums">
          {row.original.tx_count.toLocaleString(undefined, {
            notation: 'compact',
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          })}
        </div>
      ),
      size: 90,
      loading: () => <Skeleton className="h-4 w-12 mx-auto" />,
    },
    {
      accessorKey: 'unique_buyers',
      header: () => (
        <HeaderCell
          Icon={Users}
          label="Buyers"
          className="mx-auto"
          sorting={{
            sortContext: SellersSortingContext,
            sortKey: 'unique_buyers',
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-muted-foreground tabular-nums">
          {row.original.unique_buyers.toLocaleString(undefined, {
            notation: 'compact',
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          })}
        </div>
      ),
      size: 90,
      loading: () => <Skeleton className="h-4 w-12 mx-auto" />,
    },
    {
      accessorKey: 'latest_block_timestamp',
      header: () => (
        <HeaderCell
          Icon={Calendar}
          label="Latest"
          className="mx-auto"
          sorting={{
            sortContext: SellersSortingContext,
            sortKey: 'latest_block_timestamp',
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-muted-foreground tabular-nums">
          {row.original.latest_block_timestamp
            ? formatCompactAgo(row.original.latest_block_timestamp)
            : '–'}
        </div>
      ),
      size: 90,
      loading: () => <Skeleton className="h-4 w-12 mx-auto" />,
    },
    {
      accessorKey: 'chains',
      header: () => (
        <HeaderCell Icon={Globe} label="Chain" className="mx-auto" />
      ),
      cell: ({ row }) => (
        <Chains
          chains={row.original.chains}
          iconClassName="size-4"
          className="mx-auto justify-center"
        />
      ),
      size: 70,
      loading: () => <Skeleton className="size-4 mx-auto" />,
    },
    {
      accessorKey: 'tryIt',
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="https://agentcash.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Call all x402 resources with AgentCash"
              className="mx-auto flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image
                src="/agentcash-light.svg"
                alt=""
                width={16}
                height={16}
                className="size-4 block dark:hidden"
              />
              <Image
                src="/agentcash-dark.svg"
                alt=""
                width={16}
                height={16}
                className="size-4 hidden dark:block"
              />
            </a>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            Call all x402 resources with AgentCash.
          </TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const origin = row.original.origins[0]?.origin;
        if (!origin) return null;
        return <TryItButton origin={origin} />;
      },
      size: 90,
      loading: () => <Skeleton className="h-7 w-16 mx-auto rounded-md" />,
    },
  ];

/**
 * Server cell — title (curated) + description on top, hostname tucked
 * underneath in mono. Falls back to hostname-as-title when no curated title
 * exists. Address(es) and search-endpoint summary live in a hover tooltip so
 * the cell stays scannable.
 */
const ServerCell: React.FC<{ item: FeaturedServiceItem }> = ({ item }) => {
  const origin = item.origins[0];
  if (!origin) return null;

  const hostname = new URL(origin.origin).hostname;
  const rawTitle = origin.title?.trim();
  const title = rawTitle ? cleanExternalText(rawTitle) : hostname;
  const rawDescription = origin.description?.trim();
  const description = rawDescription
    ? cleanExternalText(rawDescription)
    : null;
  const showHostnameLine = title !== hostname;

  const recipients = item.recipients;
  const endpoint = item.searchEndpoint;
  const otherOrigins = item.origins.slice(1);
  const hasTooltipContent =
    recipients.length > 0 || endpoint !== undefined || otherOrigins.length > 0;

  // Stub rows from search results have id === origin URL (no x402scan record
  // exists yet). Linking to /server/<url> 404s, so jump out to the origin.
  const isExternal = origin.id.startsWith('http');
  const innerContent = (
    <>
      <Favicon url={origin.favicon} className="size-6 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
            {title}
          </span>
          {isExternal ? (
            <ArrowUpRight className="size-3 text-muted-foreground shrink-0" />
          ) : null}
          {otherOrigins.length > 0 ? (
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              +{otherOrigins.length}
            </span>
          ) : null}
        </div>
        {description ? (
          <div className="truncate text-xs text-muted-foreground mt-0.5">
            {description}
          </div>
        ) : null}
        {showHostnameLine ? (
          <div className="truncate text-[11px] font-mono text-muted-foreground/70 mt-0.5">
            {hostname}
          </div>
        ) : null}
      </div>
    </>
  );

  const trigger = isExternal ? (
    <a
      href={origin.origin}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2.5 min-w-0 group py-0.5"
    >
      {innerContent}
    </a>
  ) : (
    <Link
      href={`/server/${origin.id}`}
      className="flex items-start gap-2.5 min-w-0 group py-0.5"
    >
      {innerContent}
    </Link>
  );

  if (!hasTooltipContent) return trigger;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs space-y-2">
        {endpoint?.summary ? (
          <div>
            <p className="font-medium text-xs">
              {endpoint.method} {endpoint.path}
            </p>
            <p className="text-xs text-muted-foreground">{endpoint.summary}</p>
          </div>
        ) : null}
        {recipients.length > 0 ? (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
              Recipient
              {recipients.length === 1 ? '' : `s (${recipients.length})`}
            </p>
            <ul className="font-mono text-[11px] space-y-0.5">
              {recipients.map(addr => (
                <li key={addr}>{formatAddress(addr)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {otherOrigins.length > 0 ? (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
              Also reachable as
            </p>
            <ul className="text-[11px] space-y-0.5">
              {otherOrigins.map(o => (
                <li key={o.id}>{new URL(o.origin).hostname}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * Compact action button. Copies an AI agent prompt for the origin so users
 * can paste it into Claude/Cursor/etc. and discover the service interactively.
 * Tooltip explains what \"Try it\" actually does, since the affordance is
 * non-obvious.
 */
const TryItButton: React.FC<{ origin: string }> = ({ origin }) => {
  const [copied, setCopied] = useState(false);
  const prompt = `Use the agentcash \`discover\` command to tell me what I can do with ${origin}. If you do not have agentcash tools or skills installed, go directly to agentcash.dev/skill.md and set it up.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            void navigator.clipboard.writeText(prompt).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="mx-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <ArrowUpRight className="size-3.5" />
          )}
          {copied ? 'Copied' : 'Try it'}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="text-xs">
          {copied ? (
            'Prompt copied to clipboard.'
          ) : (
            <>
              Copies an AI prompt to your clipboard. Paste into Claude, Cursor,
              or any agent that supports{' '}
              <span className="font-mono">agentcash</span> tools to explore this
              service.
            </>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
