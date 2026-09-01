import type { DataTableColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle, XCircle } from "lucide-react";
import type { RouterOutputs } from "@/trpc/client";
import { Favicon } from "@/app/(app)/_components/favicon";

type Resource =
  RouterOutputs["admin"]["resources"]["excludes"]["searchResources"][number];

export function createColumns(
  onAction: (resource: Resource) => void
): DataTableColumnDef<Resource>[] {
  return [
    {
      accessorKey: "resource",
      header: "Resource URL",
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
      accessorKey: "origin",
      header: "Origin",
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
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return <Badge variant="secondary">{type}</Badge>;
      },
    },
    {
      accessorKey: "x402Version",
      header: "X402 Version",
      cell: ({ row }) => {
        const version = row.original.x402Version;
        return <Badge variant="outline">v{version}</Badge>;
      },
    },
    {
      accessorKey: "excluded",
      header: "Status",
      cell: ({ row }) => {
        const isExcluded = !!row.original.excluded;
        return (
          <Badge
            variant={isExcluded ? "destructive" : "default"}
            className="flex w-fit items-center gap-1"
          >
            {isExcluded ? (
              <>
                <XCircle className="h-3 w-3" />
                Excluded
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" />
                Active
              </>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: "_count",
      header: "Invocations",
      cell: ({ row }) => {
        const count = row.original._count?.invocations ?? 0;
        return <span className="text-sm text-muted-foreground">{count}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isExcluded = !!row.original.excluded;
        return (
          <Button
            type="button"
            variant={isExcluded ? "outline" : "destructive"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => onAction(row.original)}
          >
            {isExcluded ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Include
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                Exclude
              </>
            )}
          </Button>
        );
      },
    },
  ];
}
