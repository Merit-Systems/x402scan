import { Suspense } from 'react';

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '@/app/(app)/(home)/_components/transactions';

import { Section } from '@/app/_components/layout/page-utils';

import { TransfersSortingProvider } from '@/app/(app)/_contexts/sorting/transfers/provider';
import { defaultTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/default';

import { api, HydrateClient } from '@/trpc/server';

import { ActivityTimeframe } from '@/types/timeframes';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const LatestTransactions: React.FC<Props> = ({ chain }) => {
  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    chain,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    sorting: defaultTransfersSorting,
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
        <LatestTransactionsTableContainer>
          <Suspense
            fallback={
              <LoadingLatestTransactionsTable loadingRowCount={pageSize} />
            }
          >
            <LatestTransactionsTable pageSize={pageSize} />
          </Suspense>
        </LatestTransactionsTableContainer>
      </TransfersSortingProvider>
    </HydrateClient>
  );
};

export const LoadingLatestTransactions = ({
  loadingRowCount,
}: {
  loadingRowCount: number;
}) => {
  return (
    <LatestTransactionsTableContainer>
      <LoadingLatestTransactionsTable loadingRowCount={loadingRowCount} />
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
