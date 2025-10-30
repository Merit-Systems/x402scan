import { Section } from '@/app/_components/layout/page-utils';
import { api } from '@/trpc/server';
import { AgentCard } from '../lib/agent-card';

interface Props {
  userId: string;
}

export const YourAgents = async ({ userId }: Props) => {
  const yourAgents = await api.public.agents.list({
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
    <AgentsContainer>
      {yourAgents.items.map(agent => (
        <AgentCard
          key={agent.id}
          agentConfiguration={agent}
          href={`/composer/agent/${agent.id}/chat`}
        />
      ))}
    </AgentsContainer>
  );
};

const AgentsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section title="Your Agents" description="Agents you have created or used">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {children}
      </div>
    </Section>
  );
};
