"use client";

import { useState } from "react";

import { DataTable } from "@/components/ui/data-table";

import { overviewColumns } from "./columns";

import { api } from "@/trpc/client";

import { ActivityTimeframe } from "@/types/timeframes";
import { DEFAULT_TRANSFERS_SORTING } from "@/lib/table-sort-options";

interface Props {
  address: string;
  pageSize: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  address,
  pageSize,
}) => {
  const [page, setPage] = useState(0);
  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
      page,
    },
    recipients: {
      include: [address],
    },
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
