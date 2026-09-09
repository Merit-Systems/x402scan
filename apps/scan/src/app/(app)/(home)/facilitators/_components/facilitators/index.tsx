"use client";
import Link from "next/link";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";

import { FACILITATORS_SORT_IDS } from "@/lib/table-sort-options";

import { columns } from "./columns";

import type { FacilitatorsSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";
import type { listTopFacilitators } from "@/services/transfers/facilitators/list";

interface Props {
  pageSize: number;
  sorting: TableSorting<FacilitatorsSortId>;
  facilitatorsData: Awaited<ReturnType<typeof listTopFacilitators>>;
}

interface LoadingProps {
  pageSize: number;
  sorting?: TableSorting<FacilitatorsSortId>;
}

export const FacilitatorsTable: React.FC<Props> = ({
  pageSize,
  sorting,
  facilitatorsData,
}) => {
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: FACILITATORS_SORT_IDS,
  });

  return (
    <DataTable
      columns={columns}
      data={facilitatorsData.items}
      getRowHref={getFacilitatorHref}
      getRowLabel={(facilitator) => `Open ${facilitator.facilitator.name}`}
      pageSize={pageSize}
      manualSorting={true}
      rowLinkComponent={Link}
      sorting={tableSorting.tableSorting}
      onSortingChange={tableSorting.onSortingChange}
    />
  );
};

export const LoadingFacilitatorsTable: React.FC<LoadingProps> = ({
  pageSize,
  sorting,
}) => {
  return (
    <DataTableLoading
      columns={columns}
      rowCount={pageSize}
      manualSorting={true}
      sorting={sorting ? [sorting] : []}
    />
  );
};

function getFacilitatorHref(
  facilitator: Props["facilitatorsData"]["items"][number]
) {
  return `/facilitator/${facilitator.facilitator_id}` as const;
}
