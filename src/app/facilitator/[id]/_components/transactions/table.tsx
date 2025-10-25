'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useTransfersSorting } from '@/app/_contexts/sorting/transfers/hook';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { useState } from 'react';

interface Props {
  facilitatorId: string;
  pageSize: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  facilitatorId,
  pageSize,
}) => {
  const { sorting } = useTransfersSorting();
  const { startDate, endDate } = useTimeRangeContext();

  const [page, setPage] = useState(0);
  const [latestTransactions] = api.public.transfers.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
      page,
    },
    facilitatorIds: [facilitatorId],
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
