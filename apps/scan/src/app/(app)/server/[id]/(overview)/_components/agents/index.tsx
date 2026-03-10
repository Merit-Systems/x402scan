import { LoadingAgentCard } from '@/app/(app)/composer/(home)/_components/lib/agent-card';
import { Skeleton } from '@/components/ui/skeleton';

import { OriginOverviewSection } from '../section';
import { OriginAgentsContent } from './content';

interface Props {
  originId: string;
}

export const OriginAgents: React.FC<Props> = ({ originId }) => {
  return (
    <OriginOverviewSection title="Agents">
      <OriginAgentsContent originId={originId} />
    </OriginOverviewSection>
  );
};

export const LoadingOriginAgents = () => {
  return (
    <OriginOverviewSection title="Agents">
      <div className="flex flex-col gap-3">
        <Skeleton className="w-48 h-[16px]" />
        <Skeleton className="w-full h-[34px]" />
        <Skeleton className="w-20 h-[16px]" />
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <LoadingAgentCard key={index} />
        ))}
      </div>
    </OriginOverviewSection>
  );
};
