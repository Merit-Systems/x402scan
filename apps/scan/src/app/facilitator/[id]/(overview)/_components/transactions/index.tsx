import { Suspense } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { Section } from '@/app/_components/layout/page-utils';

import { LatestTransactionsTable } from '../../../_components/transactions/table';

import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';

import { columns } from '../../../_components/transactions/columns';

import { api, HydrateClient } from '@/trpc/server';

import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';

import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  facilitatorId: string;
}

export const LatestTransactions: React.FC<Props> = ({ facilitatorId }) => {
  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
    },
    facilitatorIds: [facilitatorId],
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting: defaultTransfersSorting,
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
            <LatestTransactionsTable
              facilitatorId={facilitatorId}
              pageSize={pageSize}
            />
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

const LoadingLatestTransactionsTable = ({
  loadingRowCount,
}: {
  loadingRowCount: number;
}) => {
  return (
    <DataTable
      columns={columns}
      data={[]}
      loadingRowCount={loadingRowCount}
      isLoading
    />
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
      description="x402 transactions submitted by this facilitator"
    >
      {children}
    </Section>
  );
};
