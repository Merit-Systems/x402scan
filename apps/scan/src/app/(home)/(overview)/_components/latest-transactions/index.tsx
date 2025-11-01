import { Suspense } from 'react';

import { api, HydrateClient } from '@/trpc/server';
import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '@/app/(home)/_components/transactions';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';
import { Section } from '@/app/_components/layout/page-utils';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { subDays } from 'date-fns';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const LatestTransactions: React.FC<Props> = async ({ chain }) => {
  const endDate = new Date();
  const startDate = subDays(endDate, 1);
  const pageSize = 10;

  await api.public.transfers.list.prefetch({
    chain,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    sorting: defaultTransfersSorting,
    startDate,
    endDate,
  });

  return (
    <HydrateClient>
      <TransfersSortingProvider initialSorting={defaultTransfersSorting}>
        <TimeRangeProvider
          initialEndDate={endDate}
          initialStartDate={startDate}
          creationDate={firstTransfer}
          initialTimeframe={ActivityTimeframe.OneDay}
        >
          <LatestTransactionsTableContainer>
            <Suspense fallback={<LoadingLatestTransactionsTable />}>
              <LatestTransactionsTable pageSize={pageSize} />
            </Suspense>
          </LatestTransactionsTableContainer>
        </TimeRangeProvider>
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
      actions={<RangeSelector />}
      href="/transactions"
    >
      {children}
    </Section>
  );
};
