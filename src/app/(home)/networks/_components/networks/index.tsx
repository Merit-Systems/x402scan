'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useNetworksSorting } from '@/app/_contexts/sorting/networks/hook';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import { useChain } from '@/app/_contexts/chain/hook';

export const NetworksTable: React.FC = () => {
  const { sorting } = useNetworksSorting();
  const { startDate, endDate } = useTimeRangeContext();
  const { chain } = useChain();

  const [networks] = api.networks.list.useSuspenseQuery({
    sorting,
    startDate,
    endDate,
    chain,
  });

  return (
    <DataTable columns={columns} data={networks} pageSize={networks.length} />
  );
};

export const LoadingNetworksTable = () => {
  return (
    <DataTable columns={columns} data={[]} isLoading loadingRowCount={4} />
  );
};
