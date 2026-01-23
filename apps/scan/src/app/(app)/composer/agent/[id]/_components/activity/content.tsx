'use client';

import { api } from '@/trpc/client';
import type { RouterOutputs } from '@/trpc/client';
import { ActivityCharts } from './charts';

interface Props {
  agentConfiguration: NonNullable<RouterOutputs['public']['agents']['get']>;
}

export const ActivityContent: React.FC<Props> = ({ agentConfiguration }) => {
  const [bucketedActivity] =
    api.public.agents.activity.agent.bucketed.useSuspenseQuery({
      agentConfigurationId: agentConfiguration.id,
    });

  return (
    <ActivityCharts
      agentConfiguration={agentConfiguration}
      bucketedActivity={bucketedActivity}
    />
  );
};
