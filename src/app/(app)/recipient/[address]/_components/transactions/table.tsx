'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/hook';

interface Props {
  address: string;
  limit: number;
  pageSize?: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  address,
  limit,
  pageSize,
}) => {
  const { startDate, endDate } = useTimeRangeContext();
  const { sorting } = useTransfersSorting();

  const [latestTransactions] = api.transfers.list.useSuspenseQuery({
    limit,
    recipient: address,
    sorting,
    startDate,
    endDate,
  });

  return (
    <DataTable
      columns={columns}
      data={latestTransactions.items}
      pageSize={pageSize}
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
