import { Suspense } from 'react';

import { subDays } from 'date-fns';

import { DataTable } from '@/components/ui/data-table';

import { Section } from '@/app/_components/layout/page-utils';

import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { columns } from './columns';
import { AllSellersTable } from './table';

import { SellersSortingProvider } from '../../../../../_contexts/sorting/sellers/provider';
import { defaultSellersSorting } from '../../../../../_contexts/sorting/sellers/default';

import { firstTransfer } from '@/services/facilitator/constants';

import { api, HydrateClient } from '@/trpc/server';

import { ActivityTimeframe } from '@/types/timeframes';
import { ErrorBoundary } from 'react-error-boundary';
import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const AllSellers: React.FC<Props> = async ({ chain }) => {
  const endDate = new Date();
  const startDate = subDays(endDate, 1);

  const limit = 100;

  await api.public.sellers.list.all.prefetch({
    chain,
    sorting: defaultSellersSorting,
    pagination: {
      page_size: limit,
      page: 0,
    },
    startDate,
    endDate,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider
        creationDate={firstTransfer}
        initialEndDate={endDate}
        initialStartDate={startDate}
        initialTimeframe={ActivityTimeframe.OneDay}
      >
        <SellersSortingProvider initialSorting={defaultSellersSorting}>
          <AllSellersContainer>
            <ErrorBoundary
              fallback={<p>There was an error loading the all sellers data</p>}
            >
              <Suspense fallback={<LoadingAllSellersTable />}>
                <AllSellersTable />
              </Suspense>
            </ErrorBoundary>
          </AllSellersContainer>
        </SellersSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingAllSellers = () => {
  return (
    <AllSellersContainer>
      <LoadingAllSellersTable />
    </AllSellersContainer>
  );
};

const LoadingAllSellersTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={10} isLoading />
  );
};

const AllSellersContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="All Sellers"
      description="All addresses that have received x402 transfers - known and unknown servers"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
