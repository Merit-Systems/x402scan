import { OriginOverviewSection } from '../section';
import { LoadingAgentCard } from '@/app/composer/(home)/_components/lib/agent-card';
import { OriginAgentsContent } from './content';

type Props = {
  originId: string;
};

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
