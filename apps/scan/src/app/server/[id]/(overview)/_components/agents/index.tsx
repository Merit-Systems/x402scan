import { Suspense } from 'react';
import { OriginOverviewSection } from '../section';
import { HydrateClient } from '@/trpc/server';
import { LoadingAgentCard } from '@/app/composer/(home)/_components/lib/agent-card';
import { OriginAgentsContent } from './content';

interface Props {
  originId: string;
}

export const OriginAgents: React.FC<Props> = ({ originId }) => {
  return (
    <HydrateClient>
      <OriginOverviewSection title="Agents">
        <Suspense fallback={<LoadingAgentsContent />}>
          <OriginAgentsContent originId={originId} />
        </Suspense>
      </OriginOverviewSection>
    </HydrateClient>
  );
};

export const LoadingOriginAgents = () => {
  return (
    <OriginOverviewSection title="Agents">
      <LoadingAgentsContent />
    </OriginOverviewSection>
  );
};

const LoadingAgentsContent = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <LoadingAgentCard key={index} />
      ))}
    </div>
  );
};
