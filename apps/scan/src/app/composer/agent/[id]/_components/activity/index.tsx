import { Section } from '@/app/_components/layout/page-utils';
import type { RouterOutputs } from '@/trpc/client';
import { api } from '@/trpc/server';
import { ActivityCharts, LoadingActivityCharts } from './charts';
import { Card } from '@/components/ui/card';

interface Props {
  agentConfiguration: RouterOutputs['public']['agents']['get'];
}

export const Activity: React.FC<Props> = async ({ agentConfiguration }) => {
  const bucketedActivity = await api.public.agents.activity.agent.bucketed({
    agentConfigurationId: agentConfiguration.id,
  });

  return (
    <ActivityContainer>
      <ActivityCharts
        agentConfiguration={agentConfiguration}
        bucketedActivity={bucketedActivity}
      />
    </ActivityContainer>
  );
};

export const LoadingActivity = () => {
  return (
    <ActivityContainer>
      <LoadingActivityCharts />
    </ActivityContainer>
  );
};

const ActivityContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section title="Usage">
      <Card className="overflow-hidden">{children}</Card>
    </Section>
  );
};
