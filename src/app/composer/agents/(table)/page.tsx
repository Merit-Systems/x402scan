import { Body, Heading } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/_contexts/sorting/agents/provider';
import { api, HydrateClient } from '@/trpc/server';
import { AgentsTable, LoadingAgentsTable } from './_components';
import { Suspense } from 'react';

export default async function AgentsPage() {
  await api.public.agents.list.prefetch({
    pagination: {
      page: 0,
      page_size: 10,
    },
    sorting: defaultAgentsSorting,
  });

  return (
    <HydrateClient>
      <AgentsSortingProvider initialSorting={defaultAgentsSorting}>
        <Heading
          title="Agents"
          description="Discover the most popular agents on x402scan"
        />
        <Body>
          <Suspense fallback={<LoadingAgentsTable />}>
            <AgentsTable />
          </Suspense>
        </Body>
      </AgentsSortingProvider>
    </HydrateClient>
  );
}
