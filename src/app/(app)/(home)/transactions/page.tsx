import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';
import { api, HydrateClient } from '@/trpc/server';
import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions';
import { Suspense } from 'react';
import { subMonths } from 'date-fns';
import { defaultTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/(app)/_contexts/sorting/transfers/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

export default async function TransactionsPage() {
  const limit = 150;

  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  await api.transfers.list.prefetch({
    limit,
    startDate,
    endDate,
    sorting: defaultTransfersSorting,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
        <TimeRangeProvider
          initialEndDate={endDate}
          initialStartDate={startDate}
          creationDate={firstTransfer}
          initialTimeframe={ActivityTimeframe.ThirtyDays}
        >
          <Heading
            title="Transactions"
            description="All x402 transactions through the Coinbase facilitator"
          />
          <Body>
            <Suspense
              fallback={<LoadingLatestTransactionsTable loadingRowCount={15} />}
            >
              <LatestTransactionsTable limit={limit} pageSize={15} />
            </Suspense>
          </Body>
        </TimeRangeProvider>
      </TransfersSortingProvider>
    </HydrateClient>
  );
}
