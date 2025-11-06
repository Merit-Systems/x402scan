import { Suspense } from 'react';

import {
  AgentsTable as AgentsTableComponent,
  LoadingAgentsTable,
} from '@/app/_components/agents/table/table';

import { api, HydrateClient } from '@/trpc/server';

import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';

import type { RouterInputs } from '@/trpc/client';

interface Props {
  input: Omit<
    RouterInputs['public']['agents']['list'],
    'sorting' | 'pagination'
  >;
  limit?: number;
}

export const AgentsTable: React.FC<Props> = async ({ input, limit = 10 }) => {
  await api.public.agents.list.prefetch({
    ...input,
    pagination: { page: 0, page_size: limit },
    sorting: defaultAgentsSorting,
  });

  return (
    <HydrateClient>
      <Suspense fallback={<LoadingAgentsTable />}>
        <AgentsTableComponent input={input} limit={limit} />
      </Suspense>
    </HydrateClient>
  );
};
