'use client';

import { Globe, Hash, Calendar, Tag } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { HeaderCell } from '@/components/ui/data-table/header-cell';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCompactAgo } from '@/lib/utils';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';

type ColumnType =
  RouterOutputs['public']['resources']['list']['paginated']['items'][number];

interface ColumnHandlers {
  onTagsClick?: (resource: ColumnType) => void;
}

export const createColumns = (
  handlers?: ColumnHandlers
): ExtendedColumnDef<ColumnType>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={e => e.stopPropagation()}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'resource',
    header: () => (
      <HeaderCell Icon={Globe} label="Resource" className="justify-start" />
    ),
    cell: ({ row }) => (
      <div className="text-xs font-medium truncate max-w-[300px]">
        {row.original.resource}
      </div>
    ),
    size: 300,
    loading: () => <Skeleton className="h-4 w-full" />,
  },
  {
    accessorKey: 'description',
    header: () => (
      <HeaderCell Icon={Hash} label="Description" className="mx-auto" />
    ),
    cell: ({ row }) => {
      const description = row.original.accepts[0]?.description || 'N/A';
      return (
        <div className="text-center text-xs text-muted-foreground truncate max-w-[200px]">
          {description}
        </div>
      );
    },
    size: 200,
    loading: () => <Skeleton className="h-4 w-32 mx-auto" />,
  },
  {
    accessorKey: 'invocations',
    header: () => (
      <HeaderCell Icon={Hash} label="Invocations" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original._count.invocations}
      </div>
    ),
    size: 100,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'lastUpdated',
    header: () => (
      <HeaderCell Icon={Calendar} label="Updated" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.lastUpdated)}
      </div>
    ),
    size: 120,
    loading: () => <Skeleton className="h-4 w-16 mx-auto" />,
  },
  {
    accessorKey: 'tags',
    header: () => <HeaderCell Icon={Tag} label="Tags" className="mx-auto" />,
    cell: ({ row }) => {
      const tags = row.original.tags;
      const visibleTags = tags.slice(0, 2);
      const hasMore = tags.length > 2;

      return (
        <div
          className="flex flex-wrap gap-1 justify-center cursor-pointer"
          onClick={e => {
            e.stopPropagation();
            handlers?.onTagsClick?.(row.original);
          }}
        >
          {tags.length === 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Add tags...
            </span>
          ) : (
            <>
              {visibleTags.map(resourceTag => (
                <span
                  key={resourceTag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${resourceTag.tag.color}20`,
                    borderColor: resourceTag.tag.color,
                    color: resourceTag.tag.color,
                  }}
                >
                  {resourceTag.tag.name}
                </span>
              ))}
              {hasMore && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                  ...
                </span>
              )}
            </>
          )}
        </div>
      );
    },
    size: 150,
    loading: () => <Skeleton className="h-4 w-24 mx-auto" />,
  },
];
