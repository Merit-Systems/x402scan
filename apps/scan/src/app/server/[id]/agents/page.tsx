import { Body, Heading } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/_contexts/sorting/agents/provider';
import { AgentsTable } from '@/app/_components/agents/table';

export default async function OriginAgentsPage({
  params,
}: PageProps<'/server/[id]/agents'>) {
  const { id } = await params;
  return (
    <AgentsSortingProvider initialSorting={defaultAgentsSorting}>
      <Heading
        title="Agents"
        description="Agents using resources from this origin"
      />
      <Body>
        <AgentsTable input={{ originId: id }} limit={10} />
      </Body>
    </AgentsSortingProvider>
  );
}
