import { Body, Heading } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/_contexts/sorting/agents/provider';
import { AgentsTable } from '@/app/_components/agents/table';
import { ALL_TIME_TIMEFRAME } from '@/types/timeframes';

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
        <AgentsTable
          input={{ originId: id, timeframe: ALL_TIME_TIMEFRAME }}
          limit={10}
        />
      </Body>
    </AgentsSortingProvider>
  );
}
