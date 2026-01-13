'use client';

import { api } from '@/trpc/client';
import { AgentCard } from '@/app/composer/(home)/_components/lib/agent-card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { BotOff } from 'lucide-react';
import { ALL_TIME_TIMEFRAME } from '@/types/timeframes';
import { defaultAgentsSorting } from '@/app/_contexts/sorting/agents/default';

interface Props {
  originId: string;
}

export const OriginAgentsContent: React.FC<Props> = ({ originId }) => {
  const [agents] = api.public.agents.list.useSuspenseQuery({
    originId,
    timeframe: ALL_TIME_TIMEFRAME,
    pagination: {
      page: 0,
      page_size: 6,
    },
    sorting: defaultAgentsSorting,
  });

  if (agents.items.length === 0) {
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BotOff />
          </EmptyMedia>
          <EmptyTitle>No agents</EmptyTitle>
          <EmptyDescription>
            No agents available for this server
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {agents.items.map(agent => (
        <AgentCard key={agent.id} agentConfiguration={agent} />
      ))}
    </div>
  );
};
