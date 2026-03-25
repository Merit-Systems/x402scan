'use client';

import { useState } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

import { columns } from './columns';
import { api } from '@/trpc/client';
import { useBuyerSellersSorting } from './sorting-provider';

interface Props {
  address: string;
}

export const BuyerSellersTable: React.FC<Props> = ({ address }) => {
  const { sorting } = useBuyerSellersSorting();
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [sellers] = api.public.buyers.all.sellers.useSuspenseQuery({
    sender: address,
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
      data={sellers.items}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      totalPages={sellers.total_pages}
      hasNextPage={sellers.hasNextPage}
    />
  );
};
