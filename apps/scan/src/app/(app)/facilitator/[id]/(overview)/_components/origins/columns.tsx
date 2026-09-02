import { Chains } from "@/app/(app)/_components/chains";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";
import {
  DataTableColumnHeader,
  type DataTableColumnDef,
} from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import type { RouterOutputs } from "@/trpc/client";

export type FacilitatorServer =
  RouterOutputs["public"]["sellers"]["bazaar"]["summaries"]["items"][number];

export const facilitatorServerColumns: DataTableColumnDef<FacilitatorServer>[] =
  [
    {
      id: "server",
      accessorKey: "origins",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Server"
          className="justify-start"
        />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex h-13 items-center pr-4">
          <ServiceSummary item={row.original} />
        </div>
      ),
      size: 600,
      meta: {
        loadingCell: <LoadingServiceSummary className="h-13 pr-4" />,
      },
    },
    {
      accessorKey: "chains",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Chain"
          className="justify-center"
        />
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <Chains
          chains={row.original.chains}
          iconClassName="size-4"
          className="mx-auto justify-center"
        />
      ),
      size: 100,
      meta: { loadingCell: <Skeleton className="mx-auto size-4" /> },
    },
  ];
