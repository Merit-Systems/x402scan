'use client';

import { useState } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';

import { useTransfersSorting } from '@/app/_contexts/sorting/transfers/hook';

import { api } from '@/trpc/client';

import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  address: string;
  pageSize: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  address,
  pageSize,
}) => {
  const { sorting } = useTransfersSorting();

  const [page, setPage] = useState(0);
  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
      page,
    },
    recipients: {
      include: [address],
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
      totalPages={latestTransactions.total_pages}
    />
  );
};

export const LoadingLatestTransactionsTable = ({
  loadingRowCount = 10,
}: {
  loadingRowCount?: number;
}) => {
  return (
    <DataTable
      columns={columns}
      data={[]}
      loadingRowCount={loadingRowCount}
      isLoading
    />
  );
};
