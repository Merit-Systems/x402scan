"use client";

import { Wrench } from "lucide-react";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { cleanExternalText, formatCompactAgo } from "@/lib/utils";

import { Favicon } from "@/app/(app)/_components/favicon";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";
import { KnownSellerChart, LoadingKnownSellerChart } from "./chart";

type ColumnType = RouterOutputs["public"]["tools"]["top"]["items"][number];

export const columns: DataTableColumnDef<ColumnType>[] = [
  {
    accessorKey: "resource",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tool" />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex w-full items-center gap-2 overflow-hidden">
        <Favicon
          url={row.original.origin.favicon}
          className="size-6 rounded-md border-none"
          Fallback={Wrench}
        />
        <div className="flex w-0 flex-1 flex-col overflow-hidden">
          <p className="type-mono type-emphasis type-scale-supporting w-full truncate">
            {row.original.resource}
          </p>
          <p className="line-clamp-2 w-full type-caption wrap-break-word whitespace-normal text-muted-foreground">
            {cleanExternalText(
              row.original.accepts.find((accept) => accept.description)
                ?.description ?? ""
            )}
          </p>
        </div>
      </div>
    ),
    size: 250,
    meta: {
      loadingCell: (
        <div className="flex w-full items-center gap-2 overflow-hidden">
          <Skeleton className="size-6 rounded-md" />
          <div className="flex w-0 flex-1 flex-col overflow-hidden">
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
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
    cell: ({ row }) => (
      <KnownSellerChart
        addresses={row.original.accepts.map((accept) => accept.payTo)}
      />
    ),
    size: 100,
    meta: { loadingCell: <LoadingKnownSellerChart /> },
  },
  {
    accessorKey: "toolCalls",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Calls" />
    ),
    cell: ({ row }) => (
      <div className="type-mono type-scale-caption text-center">
        {row.original.tool_calls.toLocaleString(undefined, {
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
    id: "agentConfigurations",
    accessorKey: "agent_configs",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agents" />
    ),
    cell: ({ row }) => (
      <div className="type-mono type-scale-caption text-center">
        {row.original.agent_configurations.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for volume column
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    id: "uniqueUsers",
    accessorKey: "unique_users",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Users" />
    ),
    cell: ({ row }) => (
      <div className="type-mono type-scale-caption text-center">
        {row.original.unique_users.toLocaleString(undefined, {
          notation: "compact",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        })}
      </div>
    ),
    size: 125, // Fixed width for users count
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    id: "latestCallTime",
    accessorKey: "latest_call_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latest" />
    ),
    cell: ({ row }) => (
      <div className="type-mono type-scale-caption text-center">
        {formatCompactAgo(row.original.latest_call_time ?? new Date())}
      </div>
    ),
    size: 125, // Fixed width for timestamp
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
];
