"use client";

import { api } from "@/trpc/client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { FACILITATORS_SORT_IDS } from "@/lib/table-sort-options";

import type { FacilitatorsSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

interface Props {
  chain?: Chain;
  pageSize: number;
  sorting: TableSorting<FacilitatorsSortId>;
  timeframe: ActivityTimeframe;
}

interface LoadingProps {
  pageSize: number;
  sorting?: TableSorting<FacilitatorsSortId>;
}

export const FacilitatorsTable: React.FC<Props> = ({
  chain,
  pageSize,
  sorting,
  timeframe,
}) => {
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: FACILITATORS_SORT_IDS,
  });

  const [facilitatorsData] = api.public.facilitators.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
    },
    sorting,
    timeframe,
    chain,
  });

  return (
    <DataTable
      columns={columns}
      data={facilitatorsData.items}
      pageSize={pageSize}
      manualSorting={true}
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
