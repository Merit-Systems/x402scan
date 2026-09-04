"use client";

import { Bot } from "lucide-react";

import Image from "next/image";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Favicons, LoadingFavicons } from "@/app/(app)/_components/favicon";

type ColumnType = RouterOutputs["public"]["agents"]["list"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 overflow-hidden text-sm font-medium text-muted-foreground">
        {row.original.image ? (
          <Image
            src={row.original.image}
            alt={row.original.name}
            width={32}
            height={32}
            className="size-4 shrink-0 rounded-md md:size-5"
          />
        ) : (
          <Bot className="size-4 shrink-0 md:size-5" />
        )}
        <span className="truncate text-sm font-medium text-muted-foreground">
          {row.original.name || "Untitled Agent"}
        </span>
      </div>
    ),
    size: 200,
    meta: { loadingCell: <Skeleton className="mr-auto h-4 w-16" /> },
  },
  {
    accessorKey: "resources",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resources" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
        <Favicons
          favicons={row.original.resources.map(
            (resource) => resource.originFavicon
          )}
          iconContainerClassName="size-5"
        />
      </div>
    ),
    size: 125,
    meta: {
      loadingCell: (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <LoadingFavicons count={2} iconContainerClassName="size-5" />
        </div>
      ),
    },
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Score" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {Math.cbrt(Number(row.original.score)).toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
      </div>
    ),
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "message_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messages" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.message_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for transaction count
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },

  {
    accessorKey: "user_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Users" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.user_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for buyers count
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "chat_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Chats" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.chat_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for timestamp
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
];
