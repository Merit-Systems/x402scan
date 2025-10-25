'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useTransfersSorting } from '@/app/_contexts/sorting/transfers/hook';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { useChain } from '@/app/_contexts/chain/hook';
import { useState } from 'react';

interface Props {
  pageSize: number;
}

export const Table: React.FC<Props> = ({ pageSize }) => {
  const { sorting } = useTransfersSorting();
  const { startDate, endDate } = useTimeRangeContext();
  const { chain } = useChain();

  const [page, setPage] = useState(0);

  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    chain,
    pagination: {
      page_size: pageSize,
      page,
    },
    sorting,
    startDate,
    endDate,
  });

  return (
    <DataTable
      columns={columns}
      data={latestTransactions.items}
      pageSize={pageSize}
      page={page}
      onPageChange={setPage}
      hasNextPage={latestTransactions.hasNextPage}
      totalPages={latestTransactions.total_pages}
    />
  );
};
