import { Body, Heading } from '@/app/_components/layout/page-utils';
import { api, HydrateClient } from '@/trpc/server';
import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions';
import { Suspense } from 'react';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';
import { ActivityTimeframe } from '@/types/timeframes';
import { getChain } from '@/app/_lib/chain';

export default async function TransactionsPage({
  searchParams,
}: PageProps<'/transactions'>) {
  const chain = await searchParams.then(params => getChain(params.chain));

  const pageSize = 15;

  await api.public.transfers.list.prefetch({
    sorting: defaultTransfersSorting,
    chain,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    timeframe: ActivityTimeframe.AllTime,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
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
      </TransfersSortingProvider>
    </HydrateClient>
  );
}
