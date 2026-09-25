"use client";

import {
  Bot,
  Calendar,
  CircleDot,
  MessageSquare,
  Server,
  Wrench,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { formatCompactAgo } from "@/lib/utils";

import { HeaderCell } from "@/components/ui/data-table/header-cell";

import type { ExtendedColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Favicon } from "@/app/(app)/_components/favicon";

type ColumnType =
  RouterOutputs["public"]["agents"]["activity"]["feed"]["items"][number];

export const columns: ExtendedColumnDef<ColumnType>[] = [
  {
    accessorKey: "type",
    header: () => (
      <HeaderCell Icon={CircleDot} label="Event" className="mr-auto" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {row.original.type === "message" ? (
          <>
            <MessageSquare className="size-3" />
            <span>Message</span>
          </>
        ) : (
          <>
            <Wrench className="size-3 text-primary" />
            <span>Tool Call</span>
          </>
        )}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="mr-auto h-4 w-16" />,
  },
  {
    accessorKey: "agentConfiguration",
    header: () => (
      <HeaderCell Icon={Bot} label="Agent" className="mr-auto px-2" />
    ),
    cell: ({ row }) => (
      <div className="mr-auto flex items-center gap-2 overflow-hidden px-2 font-mono text-xs font-medium text-muted-foreground">
        {row.original.agentConfiguration ? (
          <>
            <Favicon
              url={row.original.agentConfiguration.image}
              className="size-3"
              Fallback={Bot}
            />
            <span className="truncate">
              {row.original.agentConfiguration.name || "Untitled Agent"}
            </span>
          </>
        ) : (
          <>
            <MessageSquare className="size-3" />
            <span className="truncate">Playground</span>
          </>
        )}
      </div>
    ),
    size: 200,
    loading: () => <Skeleton className="mr-auto h-4 w-16" />,
  },
  {
    accessorKey: "resource",
    header: () => (
      <HeaderCell Icon={Server} label="Resource" className="mr-auto" />
    ),
    cell: ({ row }) =>
      row.original.resource ? (
        <div className="flex items-center gap-2 overflow-hidden">
          <Favicon
            url={row.original.resource?.favicon}
            className="size-3"
            Fallback={Wrench}
          />
          <span className="flex-1 truncate font-mono text-xs font-medium text-muted-foreground">
            {row.original.resource.resource}
          </span>
        </div>
      ) : null,
    size: 250,
  },
  {
    accessorKey: "time",
    header: () => (
      <HeaderCell Icon={Calendar} label="Timestamp" className="ml-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {formatCompactAgo(row.original.createdAt)}
      </div>
    ),
    size: 200,
    loading: () => <Skeleton className="ml-auto h-4 w-16" />,
  },
];
