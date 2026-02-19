import { Suspense } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { columns } from '../../../_components/transactions/columns';
import { LatestTransactionsTable } from '../../../_components/transactions/table';

import { api, HydrateClient } from '@/trpc/server';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { Section } from '@/app/_components/layout/page-utils';
import { defaultTransfersSorting } from '@/app/(app)/_contexts/sorting/transfers/default';
import { ActivityTimeframe } from '@/types/timeframes';
import { TransfersSortingProvider } from '@/app/(app)/_contexts/sorting/transfers/provider';

interface Props {
  address: string;
}

export const LatestTransactions: React.FC<Props> = ({ address }) => {
  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    recipients: {
      include: [address],
    },
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting: defaultTransfersSorting,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
        <LatestTransactionsTableContainer>
          <Suspense fallback={<LoadingLatestTransactionsTable />}>
            <LatestTransactionsTable address={address} pageSize={pageSize} />
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

const LoadingLatestTransactionsTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={10} isLoading />
  );
};

const LatestTransactionsTableContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section
      title="Latest Transactions"
      description="Latest x402 transactions to this server address"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
