import { Suspense } from 'react';
import { Section } from '@/app/_components/layout/page-utils';
import { YourAgentsContent } from './content';
import { LoadingAgentCard } from '../lib/agent-card';

type Props = {
  userId: string;
};

// Note: No HydrateClient here - parent page.tsx provides it
export const YourAgents: React.FC<Props> = ({ userId }) => {
  return (
    <Suspense fallback={<LoadingYourAgents />}>
      <YourAgentsWrapper userId={userId} />
    </Suspense>
  );
};

const YourAgentsWrapper: React.FC<Props> = ({ userId }) => {
  return (
    <AgentsContainer>
      <YourAgentsContent userId={userId} />
    </AgentsContainer>
  );
};

const LoadingYourAgents = () => {
  return (
    <AgentsContainer>
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingAgentCard key={index} />
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
