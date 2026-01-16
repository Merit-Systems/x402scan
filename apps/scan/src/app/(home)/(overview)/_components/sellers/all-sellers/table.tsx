'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useSellersSorting } from '../../../../../_contexts/sorting/sellers/hook';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { useChain } from '@/app/_contexts/chain/hook';
import { useVerifiedFilter } from '@/app/_contexts/verified-filter/hook';
import { useState } from 'react';

export const AllSellersTable = () => {
  const { sorting } = useSellersSorting();
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();
  const { verifiedOnly } = useVerifiedFilter();

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [topSellers] = api.public.sellers.all.list.useSuspenseQuery({
    chain,
    sorting,
    pagination: {
      page_size: pageSize,
      page,
    },
    timeframe,
    verifiedOnly,
  });

  return (
    <DataTable
      columns={columns}
      data={topSellers.items}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      totalPages={topSellers.total_pages}
      hasNextPage={topSellers.hasNextPage}
    />
  );
};
