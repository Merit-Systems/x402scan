'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/hook';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';

interface Props {
  limit: number;
  pageSize?: number;
}

export const Table: React.FC<Props> = ({ limit, pageSize }) => {
  const { sorting } = useTransfersSorting();
  const { startDate, endDate } = useTimeRangeContext();

  const [latestTransactions] = api.transfers.list.useSuspenseQuery({
    limit,
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
