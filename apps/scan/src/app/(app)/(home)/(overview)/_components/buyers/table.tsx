'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useBuyersSorting } from '../../../../_contexts/sorting/buyers/hook';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChain } from '@/app/(app)/_contexts/chain/hook';
import { useState } from 'react';

export const AllBuyersTable = () => {
  const { sorting } = useBuyersSorting();
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [topBuyers] = api.public.buyers.all.list.useSuspenseQuery({
    chain,
    sorting,
    pagination: {
      page_size: pageSize,
      page,
    },
    timeframe,
  });

  return (
    <DataTable
      columns={columns}
      data={topBuyers.items}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      totalPages={topBuyers.total_pages}
      hasNextPage={topBuyers.hasNextPage}
    />
  );
};
