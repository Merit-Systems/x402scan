import { Body, Heading } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/_contexts/sorting/agents/provider';
import { AgentsTable } from '@/app/_components/agents/table';

export default async function AgentsPage() {
  return (
    <AgentsSortingProvider initialSorting={defaultAgentsSorting}>
      <Heading
        title="Agents"
        description="Discover the most popular agents on x402scan"
      />
      <Body>
        <AgentsTable input={{}} limit={10} />
      </Body>
    </AgentsSortingProvider>
  );
}
