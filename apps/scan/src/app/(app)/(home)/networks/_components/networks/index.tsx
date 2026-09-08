"use client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";

import { NETWORKS_SORT_IDS } from "@/lib/table-sort-options";

import { columns } from "./columns";

import type { NetworksSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";
import type { listTopNetworks } from "@/services/transfers/networks/list";

export const NetworksTable = ({
  sorting,
  networks,
}: {
  sorting: TableSorting<NetworksSortId>;
  networks: Awaited<ReturnType<typeof listTopNetworks>>;
}) => {
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: NETWORKS_SORT_IDS,
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
