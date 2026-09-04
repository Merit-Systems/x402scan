"use client";

import { api } from "@/trpc/client";

import { DataTable } from "@/components/ui/data-table";

import { overviewColumns } from "./columns";
import { useState } from "react";
import { ActivityTimeframe } from "@/types/timeframes";
import { DEFAULT_TRANSFERS_SORTING } from "@/lib/table-sort-options";

interface Props {
  facilitatorId: string;
  pageSize: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  facilitatorId,
  pageSize,
}) => {
  const [page, setPage] = useState(0);
  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
      page,
    },
    facilitatorIds: [facilitatorId],
    sorting: DEFAULT_TRANSFERS_SORTING,
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <DataTable
      columns={overviewColumns}
      data={latestTransactions.items}
      pageSize={pageSize}
      pagination={{
        pageIndex: page,
        pageSize,
        pageCount: latestTransactions.hasNextPage ? page + 2 : page + 1,
      }}
      onPaginationChange={({ pageIndex }) => setPage(pageIndex)}
    />
  );
};
