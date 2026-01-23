'use client';

import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { useFacilitatorsSorting } from '@/app/(app)/_contexts/sorting/facilitators/hook';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

interface Props {
  pageSize: number;
}

export const FacilitatorsTable: React.FC<Props> = ({ pageSize }) => {
  const { sorting } = useFacilitatorsSorting();
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [facilitatorsData] = api.public.facilitators.list.useSuspenseQuery({
    pagination: {
      page_size: pageSize,
    },
    sorting,
    timeframe,
    chain,
  });

  return (
    <DataTable
      columns={columns}
      data={facilitatorsData.items}
      pageSize={pageSize}
    />
  );
};

export const LoadingFacilitatorsTable: React.FC<Props> = ({ pageSize }) => {
  return (
    <DataTable
      columns={columns}
      data={[]}
      isLoading
      loadingRowCount={pageSize}
    />
  );
};
