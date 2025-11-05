import { AgentsTable } from '@/app/_components/agents/table';
import { LoadingAgentsTable } from '@/app/_components/agents/table/table';
import { Section } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/_contexts/sorting/agents/provider';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { agentsRelease } from '@/lib/agents';
import { getSSRTimeRange } from '@/lib/server-time';
import { ActivityTimeframe } from '@/types/timeframes';

export const TopAgents = () => {
  const { endDate, startDate } = getSSRTimeRange(
    ActivityTimeframe.OneDay,
    agentsRelease
  );

  return (
    <TimeRangeProvider
      creationDate={agentsRelease}
      initialTimeframe={ActivityTimeframe.OneDay}
    >
      <AgentsSortingProvider initialSorting={defaultAgentsSorting}>
        <AgentsContainer>
          <AgentsTable
            input={{}}
            limit={10}
            initialTimeRange={{ startDate, endDate }}
          />
        </AgentsContainer>
      </AgentsSortingProvider>
    </TimeRangeProvider>
  );
};

export const LoadingTopAgents = () => {
  return (
    <AgentsContainer>
      <LoadingAgentsTable />
    </AgentsContainer>
  );
};

const AgentsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Top Agents"
      description="The most popular agents on x402scan"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
