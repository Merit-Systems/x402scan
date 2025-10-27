'use client';

import {
  Bot,
  CircleDot,
  MessageSquare,
  MessagesSquare,
  Server,
  Users,
  Wrench,
} from 'lucide-react';

import Image from 'next/image';

import { Skeleton } from '@/components/ui/skeleton';

import { HeaderCell } from '@/components/ui/data-table/header-cell';

import { AgentsSortingContext } from '@/app/_contexts/sorting/agents/context';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';
import { Favicons, LoadingFavicons } from '@/app/_components/favicon';

type ColumnType = RouterOutputs['public']['agents']['list']['items'][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: 'name',
    header: () => (
      <HeaderCell Icon={CircleDot} label="Name" className="mr-auto" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium overflow-hidden">
        {row.original.image ? (
          <Image
            src={row.original.image}
            alt={row.original.name}
            width={32}
            height={32}
            className="size-4 md:size-5 rounded-md shrink-0"
          />
        ) : (
          <Bot className="size-4 md:size-5 shrink-0" />
        )}
        <span className="text-sm text-muted-foreground font-medium truncate">
          {row.original.name || 'Untitled Agent'}
        </span>
      </div>
    ),
    size: 200,
    loading: () => <Skeleton className="h-4 w-16 mr-auto" />,
  },
  {
    accessorKey: 'resources',
    header: () => (
      <HeaderCell Icon={Server} label="Resources" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
        <Favicons
          favicons={row.original.resources.map(
            resource => resource.originFavicon
          )}
          iconContainerClassName="size-5"
        />
      </div>
    ),
    size: 125,
    loading: () => (
      <LoadingFavicons count={2} iconContainerClassName="size-5" />
    ),
  },
  {
    accessorKey: 'message_count',
    header: () => (
      <HeaderCell
        Icon={MessageSquare}
        label="Messages"
        className="mx-auto"
        sorting={{
          sortContext: AgentsSortingContext,
          sortKey: 'message_count',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.message_count.toLocaleString(undefined, {
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
    accessorKey: 'tool_calls',
    header: () => (
      <HeaderCell
        Icon={Wrench}
        label="Tool Calls"
        className="mx-auto"
        sorting={{
          sortContext: AgentsSortingContext,
          sortKey: 'tool_call_count',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.tool_call_count.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for tool calls column
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'user_count',
    header: () => (
      <HeaderCell
        Icon={Users}
        label="Users"
        className="mx-auto"
        sorting={{
          sortContext: AgentsSortingContext,
          sortKey: 'user_count',
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.user_count.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for buyers count
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'chat_count',
    header: () => (
      <HeaderCell
        Icon={MessagesSquare}
        label="Chats"
        sorting={{
          sortContext: AgentsSortingContext,
          sortKey: 'chat_count',
        }}
        className="mx-auto"
      />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.chat_count.toLocaleString(undefined, {
          notation: 'compact',
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for timestamp
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
];
