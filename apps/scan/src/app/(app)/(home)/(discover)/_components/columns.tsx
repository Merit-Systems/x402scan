'use client';

import {
  Activity,
  ArrowLeftRight,
  Calendar,
  Check,
  Copy,
  DollarSign,
  Globe,
  Server,
  Users,
} from 'lucide-react';
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
} from '../../(overview)/_components/sellers/known-sellers/chart';

import { Origins, OriginsSkeleton } from '@/app/(app)/_components/origins';

import { formatCompactAgo } from '@/lib/utils';
import { formatTokenAmount } from '@/lib/token';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Chains } from '@/app/(app)/_components/chains';

import type { SearchResultEndpoint } from '@/lib/discover/search';

type BazaarItem =
  RouterOutputs['public']['sellers']['bazaar']['list']['items'][number];

export type DiscoverColumnType = BazaarItem & {
  searchEndpoint?: SearchResultEndpoint;
};

export const discoverColumns: ExtendedColumnDef<DiscoverColumnType>[] = [
  {
    accessorKey: 'recipients',
    header: () => (
      <HeaderCell Icon={Server} label="Server" className="mr-auto" />
    ),
    cell: ({ row }) => {
      const endpoint = row.original.searchEndpoint;

      const originContent = (
        <Origins
          origins={row.original.origins}
          addresses={row.original.recipients}
          disableCopy
        />
      );

      const wrapped = endpoint?.summary ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">{originContent}</div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium text-xs">
              {endpoint.method} {endpoint.path}
            </p>
            <p className="text-xs text-muted-foreground">{endpoint.summary}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2">{originContent}</div>
      );

      return wrapped;
    },
    size: 225,
    loading: () => <OriginsSkeleton />,
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
    size: 100,
    loading: () => <LoadingKnownSellerChart />,
  },
  {
    accessorKey: 'tx_count',
    header: () => (
      <HeaderCell Icon={ArrowLeftRight} label="Txns" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.tx_count.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'total_amount',
    header: () => (
      <HeaderCell Icon={DollarSign} label="Volume" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'unique_buyers',
    header: () => (
      <HeaderCell Icon={Users} label="Buyers" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_buyers.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'latest_block_timestamp',
    header: () => (
      <HeaderCell Icon={Calendar} label="Latest" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.latest_block_timestamp
          ? formatCompactAgo(row.original.latest_block_timestamp)
          : '–'}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'chains',
    header: () => <HeaderCell Icon={Globe} label="Chain" className="mx-auto" />,
    cell: ({ row }) => (
      <Chains
        chains={row.original.chains}
        iconClassName="size-4"
        className="mx-auto justify-center"
      />
    ),
    size: 100,
    loading: () => <Skeleton className="size-4 mx-auto" />,
  },
  {
    accessorKey: 'tryIt',
    header: () => <></>,
    cell: ({ row }) => {
      const origin = row.original.origins[0]?.origin;
      if (!origin) return null;
      return <CopyPromptButton origin={origin} />;
    },
    size: 130,
    loading: () => <Skeleton className="h-4 w-24 mx-auto" />,
  },
];

const CopyPromptButton: React.FC<{ origin: string }> = ({ origin }) => {
  const [copied, setCopied] = useState(false);
  const prompt = `Use the agentcash \`discover\` command to tell me what I can do with ${origin}. If you do not have agentcash tools or skills installed, go directly to agentcash.dev/skill.md and set it up.`;
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        void navigator.clipboard.writeText(prompt).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? 'Copied' : 'Copy Prompt'}
    </button>
  );
};
