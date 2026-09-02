"use client";

import { api } from "@/trpc/client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { NETWORKS_SORT_IDS } from "@/lib/table-sort-options";

import type { NetworksSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

export const NetworksTable = ({
  chain,
  sorting,
  timeframe,
}: {
  chain?: Chain;
  sorting: TableSorting<NetworksSortId>;
  timeframe: ActivityTimeframe;
}) => {
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
