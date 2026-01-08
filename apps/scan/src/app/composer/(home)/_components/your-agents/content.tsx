'use client';

import { api } from '@/trpc/client';
import { AgentCard } from '../lib/agent-card';
import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  userId: string;
}

export const YourAgentsContent: React.FC<Props> = ({ userId }) => {
  const [yourAgents] = api.public.agents.list.useSuspenseQuery({
    timeframe: ActivityTimeframe.ThirtyDays,
    pagination: {
      page: 0,
      page_size: 100,
    },
    userId,
  });

  if (yourAgents.items.length === 0) {
    return null;
  }

  return (
    <>
      {yourAgents.items.map(agent => (
        <AgentCard
          key={agent.id}
          agentConfiguration={agent}
          href={`/composer/agent/${agent.id}/chat`}
        />
      ))}
    </>
  );
};
