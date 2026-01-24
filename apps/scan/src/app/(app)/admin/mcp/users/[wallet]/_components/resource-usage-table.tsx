'use client';

import { DataTable } from '@/components/ui/data-table';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { api } from '@/trpc/client';

import { columns } from './resource-usage-columns';

interface Props {
  wallet: string;
}

export const ResourceUsageTable: React.FC<Props> = ({ wallet }) => {
  const { timeframe } = useTimeRangeContext();

  const [resourceUsage] = api.admin.users.buyerResourceUsage.useSuspenseQuery({
    wallet,
    timeframe,
    limit: 20,
  });

  return <DataTable columns={columns} data={resourceUsage} pageSize={10} />;
};

export const LoadingResourceUsageTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={5} isLoading />
  );
};
