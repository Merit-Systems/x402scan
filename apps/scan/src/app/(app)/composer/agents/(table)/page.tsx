import { Body, Heading } from '@/app/_components/layout/page-utils';
import { defaultAgentsSorting } from '@/app/(app)/_contexts/sorting/agents/default';
import { AgentsSortingProvider } from '@/app/(app)/_contexts/sorting/agents/provider';
import { AgentsTable } from '@/app/(app)/_components/agents/table';
import { ActivityTimeframe } from '@/types/timeframes';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';

export default function AgentsPage() {
  return (
    <AgentsSortingProvider initialSorting={defaultAgentsSorting}>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <Heading
          title="Agents"
          description="Discover the most popular agents on x402scan"
          actions={<RangeSelector />}
        />
        <Body>
          <AgentsTable
            input={{
              timeframe: ActivityTimeframe.OneDay,
            }}
            limit={10}
          />
        </Body>
      </TimeRangeProvider>
    </AgentsSortingProvider>
  );
}
