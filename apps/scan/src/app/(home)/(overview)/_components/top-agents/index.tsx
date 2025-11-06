import { AgentsTable } from '@/app/_components/agents/table';
import { LoadingAgentsTable } from '@/app/_components/agents/table/table';
import { Section } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/_contexts/sorting/agents/provider';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { agentsRelease } from '@/lib/agents';
import { ActivityTimeframe } from '@/types/timeframes';

export const TopAgents = () => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
      <AgentsSortingProvider initialSorting={defaultAgentsSorting}>
        <AgentsContainer>
          <AgentsTable
            input={{
              timeframe: ActivityTimeframe.OneDay,
            }}
            limit={10}
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
