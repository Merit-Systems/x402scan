import { Body, Heading } from '@/app/_components/layout/page-utils';
import { api, HydrateClient } from '@/trpc/server';
import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions';
import { Suspense } from 'react';
import { subMonths } from 'date-fns';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { getChain } from '@/app/_lib/chain';

export default async function TransactionsPage({
  searchParams,
}: PageProps<'/transactions'>) {
  const chain = await searchParams.then(params => getChain(params.chain));

  const pageSize = 15;

  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  await api.public.transfers.list.prefetch({
    startDate,
    endDate,
    sorting: defaultTransfersSorting,
    chain,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
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
              fallback={
                <LoadingLatestTransactionsTable loadingRowCount={pageSize} />
              }
            >
              <LatestTransactionsTable pageSize={pageSize} />
            </Suspense>
          </Body>
        </TimeRangeProvider>
      </TransfersSortingProvider>
    </HydrateClient>
  );
}
