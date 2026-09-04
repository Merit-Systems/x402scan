"use client";

import { Bot, MessageSquare, Wrench } from "lucide-react";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCompactAgo } from "@/lib/utils";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Favicon } from "@/app/(app)/_components/favicon";

type ColumnType =
  RouterOutputs["public"]["agents"]["activity"]["feed"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Event" />
    ),
    enableSorting: false,
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
    meta: { loadingCell: <Skeleton className="mr-auto h-4 w-16" /> },
  },
  {
    accessorKey: "agentConfiguration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agent" />
    ),
    enableSorting: false,
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
    meta: { loadingCell: <Skeleton className="mr-auto h-4 w-16" /> },
  },
  {
    accessorKey: "resource",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resource" />
    ),
    enableSorting: false,
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">
        {formatCompactAgo(row.original.createdAt)}
      </div>
    ),
    size: 200,
    meta: { loadingCell: <Skeleton className="ml-auto h-4 w-16" /> },
  },
];
