import { Suspense } from 'react';
import { Section } from '@/app/_components/layout/page-utils';
import { LoadingAgentCard } from '../lib/agent-card';
import { AgentsContent } from './content';

// Note: No HydrateClient here - parent page.tsx provides it
export const Agents = () => {
  return (
    <AgentsContainer>
      <Suspense fallback={<LoadingAgentsContent />}>
        <AgentsContent />
      </Suspense>
    </AgentsContainer>
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
