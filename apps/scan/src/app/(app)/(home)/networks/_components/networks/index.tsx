"use client";

import { api } from "@/trpc/client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";
import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { useChain } from "@/app/(app)/_contexts/chain/hook";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { NETWORKS_SORT_IDS } from "@/lib/table-sort-options";

import type { NetworksSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

export const NetworksTable = ({
  sorting,
}: {
  sorting: TableSorting<NetworksSortId>;
}) => {
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: NETWORKS_SORT_IDS,
  });

  const [networks] = api.networks.list.useSuspenseQuery({
    sorting,
    timeframe,
    chain,
  });

  return (
    <DataTable
      columns={columns}
      data={networks}
      pageSize={networks.length}
      manualSorting={true}
      sorting={tableSorting.tableSorting}
      onSortingChange={tableSorting.onSortingChange}
    />
  );
};

export const LoadingNetworksTable = ({
  sorting,
}: {
  sorting?: TableSorting<NetworksSortId>;
}) => {
  return (
    <DataTableLoading
      columns={columns}
      rowCount={4}
      manualSorting={true}
      sorting={sorting ? [sorting] : []}
    />
  );
};
