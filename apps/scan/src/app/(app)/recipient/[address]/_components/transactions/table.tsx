"use client";

import { useState } from "react";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns, overviewColumns } from "./columns";

import { api } from "@/trpc/client";

import { ActivityTimeframe } from "@/types/timeframes";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import {
  DEFAULT_TRANSFERS_SORTING,
  TRANSFERS_SORT_IDS,
} from "@/lib/table-sort-options";

import type { TransfersSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

interface Props {
  address: string;
  pageSize: number;
  sorting?: TableSorting<TransfersSortId>;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  address,
  pageSize,
  sorting,
}) => {
  const tableSorting = useUrlTableSorting({
    sorting: sorting ?? DEFAULT_TRANSFERS_SORTING,
    sortIds: TRANSFERS_SORT_IDS,
  });

  const [page, setPage] = useState(0);
  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
      page,
    },
    recipients: {
      include: [address],
    },
    sorting: sorting ?? DEFAULT_TRANSFERS_SORTING,
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <DataTable
      columns={sorting ? columns : overviewColumns}
      data={latestTransactions.items}
      pageSize={pageSize}
      manualSorting={sorting !== undefined}
      sorting={sorting ? tableSorting.tableSorting : undefined}
      onSortingChange={sorting ? tableSorting.onSortingChange : undefined}
      pagination={{
        pageIndex: page,
        pageSize,
        pageCount: latestTransactions.hasNextPage ? page + 2 : page + 1,
      }}
      onPaginationChange={({ pageIndex }) => setPage(pageIndex)}
    />
  );
};

export const LoadingLatestTransactionsTable = ({
  loadingRowCount = 10,
  sorting,
}: {
  loadingRowCount?: number;
  sorting?: TableSorting<TransfersSortId>;
}) => {
  return (
    <DataTableLoading
      columns={sorting ? columns : overviewColumns}
      rowCount={loadingRowCount}
      manualSorting={sorting !== undefined}
      sorting={sorting ? [sorting] : []}
    />
  );
};
