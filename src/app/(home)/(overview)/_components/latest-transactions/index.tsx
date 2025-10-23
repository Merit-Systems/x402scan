import { Suspense } from 'react';

import { api, HydrateClient } from '@/trpc/server';
import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from '@/app/(home)/_components/transactions';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import { TransfersSortingProvider } from '@/app/_contexts/sorting/transfers/provider';
import { Section } from '../utils';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { subMonths } from 'date-fns';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const LatestTransactions: React.FC<Props> = ({ chain }) => {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);
  const limit = 100;

  void api.transfers.list.prefetch({
    chain,
    limit,
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
          initialTimeframe={ActivityTimeframe.ThirtyDays}
        >
          <LatestTransactionsTableContainer>
            <Suspense fallback={<LoadingLatestTransactionsTable />}>
              <LatestTransactionsTable limit={limit} />
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
