import { Body, Heading } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/(app)/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/(app)/_contexts/sorting/agents/provider';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { AgentsTable } from '@/app/(app)/_components/agents/table';
import { ALL_TIME_TIMEFRAME } from '@/types/timeframes';
import { resolveServerOriginId } from '@/lib/resolve-server-origin-id';

export default async function OriginAgentsPage({
  params,
}: PageProps<'/server/[id]/agents'>) {
  const { id: idParam } = await params;
  const id = await resolveServerOriginId(idParam);
  return (
    <TimeRangeProvider initialTimeframe={ALL_TIME_TIMEFRAME}>
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
    </TimeRangeProvider>
  );
}
