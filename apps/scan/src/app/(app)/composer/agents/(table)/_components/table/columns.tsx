"use client";

import { Bot } from "lucide-react";

import Image from "next/image";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { Favicons, LoadingFavicons } from "@/app/(app)/_components/favicon";

type ColumnType = RouterOutputs["public"]["agents"]["list"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Name"
        className="text-left"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 overflow-hidden text-muted-foreground">
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
        <span className="truncate type-label">
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
      <DataTableColumnHeader
        column={column}
        title="Resources"
        className="text-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
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
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <LoadingFavicons count={2} iconContainerClassName="size-5" />
        </div>
      ),
    },
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Score"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>
        {Math.cbrt(Number(row.original.score)).toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
      </Cell>
    ),
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "message_count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Messages"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>
        {row.original.message_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </Cell>
    ),
    size: 125,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },

  {
    accessorKey: "user_count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Users"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>
        {row.original.user_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </Cell>
    ),
    size: 125,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "chat_count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Chats"
        className="justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <Cell>
        {row.original.chat_count.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </Cell>
    ),
    size: 125,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
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
