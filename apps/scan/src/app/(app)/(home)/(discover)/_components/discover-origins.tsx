'use client';

import { DataTable } from '@/components/ui/data-table';

import { useSellersSorting } from '@/app/(app)/_contexts/sorting/sellers/hook';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

import { discoverColumns as columns } from './columns';
import { api } from '@/trpc/client';

interface Props {
  originUrls: string[];
}

export const DiscoverSellersTable: React.FC<Props> = ({ originUrls }) => {
  const { sorting } = useSellersSorting();
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [topSellers] = api.public.sellers.bazaar.list.useSuspenseQuery({
    chain,
    pagination: {
      page_size: 100,
    },
    timeframe,
    sorting,
    originUrls,
  });

  return <DataTable columns={columns} data={topSellers.items} pageSize={15} />;
};

export const LoadingDiscoverSellersTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={15} isLoading />
  );
};
