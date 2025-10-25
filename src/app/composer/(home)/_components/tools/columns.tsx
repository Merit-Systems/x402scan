'use client';

import {
  Activity,
  ArrowLeftRight,
  Bot,
  Calendar,
  Users,
  Wrench,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { formatCompactAgo } from '@/lib/utils';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { ToolsSortingContext } from '@/app/_contexts/sorting/tools/context';
import { Favicon } from '@/app/_components/favicon';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { KnownSellerChart, LoadingKnownSellerChart } from './chart';

type ColumnType = RouterOutputs['public']['tools']['top']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'resource',
    header: () => <HeaderCell Icon={Wrench} label="Tool" className="mr-auto" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <Favicon
          url={row.original.origin.favicon}
          className="size-6 rounded-md border-none"
          Fallback={Wrench}
        />
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <p className="truncate w-full text-xs md:text-sm font-mono font-semibold">
            {row.original.resource}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground w-full break-words whitespace-normal line-clamp-2">
            {row.original.accepts[0].description}
          </p>
        </div>
      </div>
    ),
    size: 250,
    loading: () => (
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <Skeleton className="size-6 rounded-md" />
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'chart',
    header: () => (
      <HeaderCell Icon={Activity} label="Activity" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <KnownSellerChart
        addresses={row.original.accepts.map(accept => accept.payTo)}
      />
    ),
    size: 100,
    loading: () => <LoadingKnownSellerChart />,
  },
  {
    accessorKey: 'toolCalls',
    header: () => (
      <HeaderCell Icon={ArrowLeftRight} label="Calls" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.tool_calls.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for transaction count
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'agent_configs',
    header: () => (
      <HeaderCell
        Icon={Bot}
        label="Agents"
        className="mx-auto"
        sorting={{
          sortContext: ToolsSortingContext,
          sortKey: 'agentConfigurations',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.agent_configurations.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for volume column
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'unique_users',
    header: () => <HeaderCell Icon={Users} label="Users" className="mx-auto" />,
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.unique_users.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for users count
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'latest_call_time',
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Latest"
        sorting={{
          sortContext: ToolsSortingContext,
          sortKey: 'latestCallTime',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.latest_call_time ?? new Date())}
      </div>
    ),
    size: 125, // Fixed width for timestamp
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
