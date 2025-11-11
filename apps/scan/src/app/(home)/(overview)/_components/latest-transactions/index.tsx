import { Suspense } from 'react';

import { api, HydrateClient } from '@/trpc/server';
import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '@/app/(home)/_components/transactions';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';
import { Section } from '@/app/_components/layout/page-utils';
import { ActivityTimeframe } from '@/types/timeframes';
import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const LatestTransactions: React.FC<Props> = async ({ chain }) => {
  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    chain,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    sorting: defaultTransfersSorting,
    timeframe: ActivityTimeframe.AllTime,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
        <LatestTransactionsTableContainer>
          <Suspense fallback={<LoadingLatestTransactionsTable />}>
            <LatestTransactionsTable pageSize={pageSize} />
          </Suspense>
        </LatestTransactionsTableContainer>
      </TransfersSortingProvider>
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

const LatestTransactionsTableContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section
      title="Transactions"
      description="x402 requests made through known facilitators"
      href="/transactions"
    >
      {children}
    </Section>
  );
};
