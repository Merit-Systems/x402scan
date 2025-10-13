import { Suspense } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { columns } from '../../../_components/transactions/columns';
import { LatestTransactionsTable } from '../../../_components/transactions/table';

import { api, HydrateClient } from '@/trpc/server';
import { subMonths } from 'date-fns';
import { defaultTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/default';
import { Section } from '@/app/(app)/(home)/(overview)/_components/utils';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import { TransfersSortingProvider } from '@/app/(app)/_contexts/sorting/transfers/provider';

interface Props {
  addresses: string[];
}

export const LatestTransactions: React.FC<Props> = async ({ addresses }) => {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);
  const limit = 100;

  await api.transfers.list.prefetch({
    limit,
    facilitators: addresses,
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
                addresses={addresses}
                limit={limit}
                pageSize={10}
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
