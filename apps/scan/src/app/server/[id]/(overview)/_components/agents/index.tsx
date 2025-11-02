import { OriginOverviewSection } from '../section';
import { api } from '@/trpc/server';
import {
  AgentCard,
  LoadingAgentCard,
} from '@/app/composer/(home)/_components/lib/agent-card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { BotOff } from 'lucide-react';

interface Props {
  originId: string;
}

export const OriginAgents: React.FC<Props> = async ({ originId }) => {
  const agents = await api.public.agents.list({
    originId,
    pagination: {
      page: 0,
      page_size: 6,
    },
  });

  return (
    <OriginOverviewSection title="Agents">
      {agents.items.length > 0 ? (
        <div className="flex flex-col gap-4">
          {agents.items.map(agent => (
            <AgentCard key={agent.id} agentConfiguration={agent} />
          ))}
        </div>
      ) : (
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
      )}
    </OriginOverviewSection>
  );
};

export const LoadingOriginAgents = () => {
  return (
    <OriginOverviewSection title="Agents">
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingAgentCard key={index} />
        ))}
      </div>
    </OriginOverviewSection>
  );
};
