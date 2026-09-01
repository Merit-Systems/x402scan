"use client";

import { api } from "@/trpc/client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";
import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { useChain } from "@/app/(app)/_contexts/chain/hook";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { FACILITATORS_SORT_IDS } from "@/lib/table-sort-options";

import type { FacilitatorsSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

interface Props {
  pageSize: number;
  sorting: TableSorting<FacilitatorsSortId>;
}

interface LoadingProps {
  pageSize: number;
  sorting?: TableSorting<FacilitatorsSortId>;
}

export const FacilitatorsTable: React.FC<Props> = ({ pageSize, sorting }) => {
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();
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
