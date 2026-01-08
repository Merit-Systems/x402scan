'use client';

import { api } from '@/trpc/client';
import { AgentCard } from '../lib/agent-card';
import { ActivityTimeframe } from '@/types/timeframes';

export const AgentsContent: React.FC = () => {
  const [topAgents] = api.public.agents.list.useSuspenseQuery({
    timeframe: ActivityTimeframe.OneDay,
    pagination: {
      page: 0,
      page_size: 10,
    },
  });

  return (
    <>
      {topAgents.items.slice(0, 4).map(agent => (
        <AgentCard key={agent.id} agentConfiguration={agent} />
      ))}
    </>
  );
};
