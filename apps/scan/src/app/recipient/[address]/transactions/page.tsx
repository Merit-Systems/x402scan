import { Suspense } from 'react';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions/table';

import { api, HydrateClient } from '@/trpc/server';
import { subMonths } from 'date-fns';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { ActivityTimeframe } from '@/types/timeframes';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';

export default async function TransactionsPage({
  params,
}: PageProps<'/recipient/[address]/transactions'>) {
  const { address } = await params;

  const pageSize = 15;
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  const [firstTransfer] = await Promise.all([
    api.public.stats.firstTransferTimestamp({
      recipients: {
        include: [address],
      },
    }),
    api.public.transfers.list.prefetch({
      pagination: {
        page_size: pageSize,
        page: 0,
      },
      recipients: {
        include: [address],
      },
      startDate,
      endDate,
      sorting: defaultTransfersSorting,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider
        creationDate={firstTransfer ?? startDate}
        initialEndDate={endDate}
        initialStartDate={startDate}
        initialTimeframe={ActivityTimeframe.ThirtyDays}
      >
        <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
          <Heading
            title="Transactions"
            description="x402 transactions to this server address"
          />
          <Body>
            <Suspense
              fallback={<LoadingLatestTransactionsTable loadingRowCount={15} />}
            >
              <LatestTransactionsTable address={address} pageSize={pageSize} />
            </Suspense>
          </Body>
        </TransfersSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
