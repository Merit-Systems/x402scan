'use client';

import { DataTable } from '@/components/ui/data-table';

import { useSellersSorting } from '@/app/(app)/_contexts/sorting/sellers/hook';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

import {
  featuredServiceColumns as columns,
  type FeaturedServiceItem,
} from '@/app/(app)/(home)/(overview)/_components/sellers/featured-columns';
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
      page_size: 400,
    },
    timeframe,
    sorting,
    originUrls,
  });

  return (
    <DataTable
      columns={columns}
      data={topSellers.items as FeaturedServiceItem[]}
      pageSize={15}
    />
  );
};

export const LoadingDiscoverSellersTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={15} isLoading />
  );
};
