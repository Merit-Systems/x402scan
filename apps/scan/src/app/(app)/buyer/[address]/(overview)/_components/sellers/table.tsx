"use client";

import { useState } from "react";

import { DataTable } from "@/components/ui/data-table";

import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { useChain } from "@/app/(app)/_contexts/chain/hook";

import { columns } from "./columns";
import { api } from "@/trpc/client";
import { DEFAULT_BUYER_SELLERS_SORTING } from "@/lib/table-sort-options";

interface Props {
  address: string;
}

export const BuyerSellersTable: React.FC<Props> = ({ address }) => {
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [sellers] = api.public.buyers.all.sellers.useSuspenseQuery({
    sender: address,
    chain,
    sorting: DEFAULT_BUYER_SELLERS_SORTING,
    pagination: {
      page_size: pageSize,
      page,
    },
    timeframe,
  });

  return (
    <DataTable
      columns={columns}
      data={sellers.items}
      pageSize={pageSize}
      pagination={{
        pageIndex: page,
        pageSize,
        pageCount: sellers.total_pages,
      }}
      onPaginationChange={({ pageIndex }) => setPage(pageIndex)}
    />
  );
};
