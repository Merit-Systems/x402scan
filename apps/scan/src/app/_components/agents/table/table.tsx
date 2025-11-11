'use client';

import { useState } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';

import { api } from '@/trpc/client';

import { useAgentsSorting } from '@/app/_contexts/sorting/agents/hook';

import type { RouterInputs } from '@/trpc/client';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

interface Props {
  input: Omit<
    RouterInputs['public']['agents']['list'],
    'sorting' | 'pagination'
  >;
  limit?: number;
  useTimeRange?: boolean;
}

export const AgentsTable: React.FC<Props> = ({
  input,
  limit = 10,
  useTimeRange = false,
}) => {
  const { timeframe } = useTimeRangeContext();
  const { sorting } = useAgentsSorting();

  const [page, setPage] = useState(0);
  const [agents] = api.public.agents.list.useSuspenseQuery({
    ...input,
    sorting,
    pagination: {
      page,
      page_size: limit,
    },
    timeframe,
  });

  return (
    <DataTable
      columns={columns}
      data={agents.items}
      href={({ id }) => `/composer/agent/${id}`}
      page={page}
      onPageChange={setPage}
      pageSize={10}
      hasNextPage={agents.hasNextPage}
      totalPages={agents.total_pages}
    />
  );
};

export const LoadingAgentsTable = ({ limit = 10 }: { limit?: number }) => {
  return (
    <DataTable
      columns={columns}
      data={[]}
      isLoading={true}
      loadingRowCount={limit}
    />
  );
};
