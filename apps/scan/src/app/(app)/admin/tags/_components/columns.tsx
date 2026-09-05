"use client";

import { Globe, Hash, Calendar, Tag } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderCell } from "@/app/(app)/admin/_components/data-table-header-cell";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cleanExternalText, formatCompactAgo } from "@/lib/utils";

import { ResourcesSortingContext } from "@/app/(app)/admin/_contexts/sorting/resource-tags/context";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type ColumnType =
  RouterOutputs["public"]["resources"]["list"]["paginated"]["items"][number];

interface ColumnHandlers {
  onTagsClick?: (resource: ColumnType) => void;
}

export const createColumns = (
  handlers?: ColumnHandlers
): DataTableColumnDef<ColumnType>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(!!value);
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
        }}
        aria-label="Select row"
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "resource",
    header: () => (
      <HeaderCell Icon={Globe} label="Resource" className="justify-start" />
    ),
    cell: ({ row }) => (
      <div className="type-emphasis max-w-[300px] truncate type-caption">
        {row.original.resource}
      </div>
    ),
    size: 300,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "description",
    header: () => (
      <HeaderCell Icon={Hash} label="Description" className="mx-auto" />
    ),
    cell: ({ row }) => {
      const description = cleanExternalText(
        row.original.accepts.find(
          (accept: { description?: string }) => accept.description
        )?.description ?? "N/A"
      );
      return (
        <div className="max-w-[200px] truncate text-center type-caption text-muted-foreground">
          {description}
        </div>
      );
    },
    size: 200,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-32" /> },
  },
  {
    accessorKey: "toolCalls",
    header: () => (
      <HeaderCell
        Icon={Hash}
        label="# Tool Calls"
        className="mx-auto"
        sorting={{
          sortContext: ResourcesSortingContext,
          sortKey: "toolCalls",
        }}
      />
    ),
    cell: ({ row }) => {
      const { _count: counts } = row.original;
      return (
        <div className="type-mono type-scale-caption text-center">
          {counts.toolCalls}
        </div>
      );
    },
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "lastUpdated",
    header: () => (
      <HeaderCell
        Icon={Calendar}
        label="Updated"
        className="mx-auto"
        sorting={{
          sortContext: ResourcesSortingContext,
          sortKey: "lastUpdated",
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="type-mono type-scale-caption text-center">
        {formatCompactAgo(row.original.lastUpdated)}
      </div>
    ),
    size: 120,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "tags",
    header: () => <HeaderCell Icon={Tag} label="Tags" className="mx-auto" />,
    cell: ({ row }) => {
      const tags = row.original.tags;
      const visibleTags = tags.slice(0, 2);
      const hasMore = tags.length > 2;

      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full flex-wrap justify-center gap-1"
          onClick={() => {
            handlers?.onTagsClick?.(row.original);
          }}
        >
          {tags.length === 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 type-caption text-muted-foreground transition-colors hover:text-foreground">
              Add tags...
            </span>
          ) : (
            <>
              {visibleTags.map(
                (resourceTag: {
                  id: string;
                  tag: { color: string; name: string };
                }) => (
                  <span
                    key={resourceTag.id}
                    className="type-emphasis inline-flex items-center rounded-full border px-2 py-0.5 type-caption"
                    style={{
                      backgroundColor: `${resourceTag.tag.color}20`,
                      borderColor: resourceTag.tag.color,
                      color: resourceTag.tag.color,
                    }}
                  >
                    {resourceTag.tag.name}
                  </span>
                )
              )}
              {hasMore && (
                <span className="inline-flex items-center px-2 py-0.5 type-caption text-muted-foreground">
                  ...
                </span>
              )}
            </>
          )}
        </Button>
      );
    },
    size: 150,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-24" /> },
  },
];
