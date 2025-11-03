import { Suspense } from 'react';

import { subMonths } from 'date-fns';

import { DataTable } from '@/components/ui/data-table';

import { Section } from '@/app/_components/layout/page-utils';

import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';

import { columns } from '../../../_components/transactions/columns';
import { LatestTransactionsTable } from '../../../_components/transactions/table';

import { api, HydrateClient } from '@/trpc/server';

import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';

import { firstTransfer } from '@/services/facilitator/constants';

import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  facilitatorId: string;
}

export const LatestTransactions: React.FC<Props> = async ({
  facilitatorId,
}) => {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);
  const pageSize = 10;

  await api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
    },
    facilitatorIds: [facilitatorId],
    startDate,
    endDate,
    sorting: defaultTransfersSorting,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider
        initialEndDate={endDate}
        initialStartDate={startDate}
        creationDate={firstTransfer}
        initialTimeframe={ActivityTimeframe.ThirtyDays}
      >
        <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
          <LatestTransactionsTableContainer>
            <Suspense fallback={<LoadingLatestTransactionsTable />}>
              <LatestTransactionsTable
                facilitatorId={facilitatorId}
                pageSize={pageSize}
              />
            </Suspense>
          </LatestTransactionsTableContainer>
        </TransfersSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingLatestTransactions = () => {
  return (
    <LatestTransactionsTableContainer>
      <LoadingLatestTransactionsTable />
    </LatestTransactionsTableContainer>
  );
};

const LoadingLatestTransactionsTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={10} isLoading />
  );
};

const LatestTransactionsTableContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section
      title="Transactions"
      description="x402 transactions submitted by this facilitator"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
