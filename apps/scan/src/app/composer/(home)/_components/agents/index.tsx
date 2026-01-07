import { Suspense } from 'react';
import { Section } from '@/app/_components/layout/page-utils';
import { LoadingAgentCard } from '../lib/agent-card';
import { HydrateClient } from '@/trpc/server';
import { AgentsContent } from './content';

export const Agents = () => {
  return (
    <HydrateClient>
      <AgentsContainer>
        <Suspense fallback={<LoadingAgentsContent />}>
          <AgentsContent />
        </Suspense>
      </AgentsContainer>
    </HydrateClient>
  );
};

export const LoadingAgents = () => {
  return (
    <AgentsContainer>
      <LoadingAgentsContent />
    </AgentsContainer>
  );
};

const LoadingAgentsContent = () => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingAgentCard key={index} />
      ))}
    </>
  );
};

const AgentsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Top Agents"
      description="Try out the most popular agents"
      href="/composer/agents"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {children}
      </div>
    </Section>
  );
};
