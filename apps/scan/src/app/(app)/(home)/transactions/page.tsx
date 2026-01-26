import { Suspense } from 'react';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions';

import { defaultTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/(app)/_contexts/sorting/transfers/provider';

import { getChainForPage } from '@/app/(app)/_lib/chain/page';

import { ActivityTimeframe } from '@/types/timeframes';

import { api, HydrateClient } from '@/trpc/server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'All x402 transactions',
};

export default async function TransactionsPage({
  searchParams,
}: PageProps<'/transactions'>) {
  const chain = await getChainForPage(await searchParams);

  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    sorting: defaultTransfersSorting,
    chain,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
        <Heading
          title="Transactions"
          description="All x402 transactions through facilitators we track"
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
      </TransfersSortingProvider>
    </HydrateClient>
  );
}
