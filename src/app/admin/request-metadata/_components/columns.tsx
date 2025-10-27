import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Plus } from 'lucide-react';
import type { RouterOutputs } from '@/trpc/client';
import { Favicon } from '@/app/_components/favicon';

export const columns: ColumnDef<
  RouterOutputs['admin']['resources']['requestMetadata']['searchResources'][number]
>[] = [
  {
    accessorKey: 'resource',
    header: 'Resource URL',
    cell: ({ row }) => {
      const resource = row.original.resource;
      return (
        <div className="max-w-xs truncate" title={resource}>
          {resource}
        </div>
      );
    },
  },
  {
    accessorKey: 'origin',
    header: 'Origin',
    cell: ({ row }) => {
      const origin = row.original.origin;
      return (
        <div className="flex items-center gap-2">
          <Favicon url={origin.favicon} />
          <span className="max-w-xs truncate" title={origin.origin}>
            {origin.origin}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      return <Badge variant="secondary">{type}</Badge>;
    },
  },
  {
    accessorKey: 'x402Version',
    header: 'X402 Version',
    cell: ({ row }) => {
      const version = row.original.x402Version;
      return <Badge variant="outline">v{version}</Badge>;
    },
  },
  {
    accessorKey: 'requestMetadata',
    header: 'Has Metadata',
    cell: ({ row }) => {
      const hasMetadata = !!row.original.requestMetadata;
      return (
        <Badge variant={hasMetadata ? 'default' : 'secondary'}>
          {hasMetadata ? 'Configured' : 'Not Configured'}
        </Badge>
      );
    },
  },
  {
    accessorKey: '_count',
    header: 'Invocations',
    cell: ({ row }) => {
      const count = row.original._count?.invocations ?? 0;
      return <span className="text-sm text-muted-foreground">{count}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const hasMetadata = !!row.original.requestMetadata;
      return (
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          {hasMetadata ? (
            <Edit className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      );
    },
  },
];
