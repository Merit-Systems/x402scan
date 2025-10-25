'use client';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';

import { api } from '@/trpc/client';
import { useAgentsSorting } from '@/app/_contexts/sorting/agents/hook';
import { useState } from 'react';

export const AgentsTable = () => {
  const { sorting } = useAgentsSorting();

  const [page, setPage] = useState(0);
  const [agents] = api.public.agents.list.useSuspenseQuery({
    pagination: {
      page: page,
      page_size: 10,
    },
    sorting,
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

export const LoadingAgentsTable = () => {
  return (
    <DataTable
      columns={columns}
      data={[]}
      isLoading={true}
      loadingRowCount={10}
    />
  );
};
