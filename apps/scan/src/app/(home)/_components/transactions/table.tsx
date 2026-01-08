'use client';

import { useState } from 'react';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { useChain } from '@/app/_contexts/chain/hook';
import { useTransfersSorting } from '@/app/_contexts/sorting/transfers/hook';

import { columns } from './columns';

import { ActivityTimeframe } from '@/types/timeframes';

type Props = {
  pageSize: number;
};

export const Table: React.FC<Props> = ({ pageSize }) => {
  const { sorting } = useTransfersSorting();
  const { chain } = useChain();

  const [page, setPage] = useState(0);

  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    chain,
    pagination: {
      page_size: pageSize,
      page,
    },
    sorting,
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <DataTable
      columns={columns}
      data={latestTransactions.items}
      pageSize={pageSize}
      page={page}
      onPageChange={setPage}
      hasNextPage={latestTransactions.hasNextPage}
    />
  );
};
