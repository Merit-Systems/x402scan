import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions/table';

import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';

import { api, HydrateClient } from '@/trpc/server';

import { facilitatorIdMap } from '@/lib/facilitators';

import { ActivityTimeframe } from '@/types/timeframes';

export default async function TransactionsPage({
  params,
}: PageProps<'/facilitator/[id]/transactions'>) {
  const { id } = await params;

  const facilitator = facilitatorIdMap.get(id);

  if (!facilitator) {
    return notFound();
  }

  const pageSize = 15;

  await api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    facilitatorIds: [id],
    timeframe: ActivityTimeframe.AllTime,
    sorting: defaultTransfersSorting,
  });

  return (
    <HydrateClient>
      <Heading
        title="Transactions"
        description="Transactions made through this facilitator"
      />
      <Body>
        <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
          <Suspense
            fallback={
              <LoadingLatestTransactionsTable loadingRowCount={pageSize} />
            }
          >
            <LatestTransactionsTable facilitatorId={id} pageSize={pageSize} />
          </Suspense>
        </TransfersSortingProvider>
      </Body>
    </HydrateClient>
  );
}
