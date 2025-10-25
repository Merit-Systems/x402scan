import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions/table';

import { api, HydrateClient } from '@/trpc/server';
import { facilitatorIdMap } from '@/lib/facilitators';
import { subMonths } from 'date-fns';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { ActivityTimeframe } from '@/types/timeframes';
import { firstTransfer } from '@/services/facilitator/constants';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';

export default async function TransactionsPage({
  params,
}: PageProps<'/facilitator/[id]/transactions'>) {
  const { id } = await params;

  const facilitator = facilitatorIdMap.get(id);

  if (!facilitator) {
    return notFound();
  }

  const pageSize = 15;
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  await api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    facilitatorIds: [id],
    startDate,
    endDate,
    sorting: defaultTransfersSorting,
  });

  return (
    <HydrateClient>
      <Heading
        title="Transactions"
        description="Transactions made through this facilitator"
      />
      <Body>
        <TimeRangeProvider
          initialEndDate={endDate}
          initialStartDate={startDate}
          creationDate={firstTransfer}
          initialTimeframe={ActivityTimeframe.ThirtyDays}
        >
          <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
            <Suspense
              fallback={
                <LoadingLatestTransactionsTable loadingRowCount={pageSize} />
              }
            >
              <LatestTransactionsTable facilitatorId={id} pageSize={pageSize} />
            </Suspense>
          </TransfersSortingProvider>
        </TimeRangeProvider>
      </Body>
    </HydrateClient>
  );
}
