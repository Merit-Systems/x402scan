import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { DataTable } from '@/components/ui/data-table';

import { Section } from '@/app/_components/layout/page-utils';

import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

import { columns } from './columns';
import { AllBuyersTable } from './table';

import { BuyersSortingProvider } from '../../../../_contexts/sorting/buyers/provider';
import { defaultBuyersSorting } from '../../../../_contexts/sorting/buyers/default';

import { api, HydrateClient } from '@/trpc/server';

import { ActivityTimeframe } from '@/types/timeframes';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const AllBuyers: React.FC<Props> = ({ chain }) => {
  const pageSize = 10;

  void api.public.buyers.all.list.prefetch({
    chain,
    sorting: defaultBuyersSorting,
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    timeframe: ActivityTimeframe.OneDay,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <BuyersSortingProvider initialSorting={defaultBuyersSorting}>
          <AllBuyersContainer>
            <ErrorBoundary
              fallback={<p>There was an error loading the all buyers data</p>}
            >
              <Suspense fallback={<LoadingAllBuyersTable />}>
                <AllBuyersTable />
              </Suspense>
            </ErrorBoundary>
          </AllBuyersContainer>
        </BuyersSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingAllBuyers = () => {
  return (
    <AllBuyersContainer>
      <LoadingAllBuyersTable />
    </AllBuyersContainer>
  );
};

const LoadingAllBuyersTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={10} isLoading />
  );
};

const AllBuyersContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="All Buyers"
      description="All addresses that have sent x402 transfers"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
