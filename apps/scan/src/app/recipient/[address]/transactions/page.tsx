import { Suspense } from 'react';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '../_components/transactions/table';

import { HydrateClient } from '@/trpc/server';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';

export default async function TransactionsPage({
  params,
}: PageProps<'/recipient/[address]/transactions'>) {
  const { address } = await params;

  const pageSize = 15;

  return (
    <HydrateClient>
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
    </HydrateClient>
  );
}
