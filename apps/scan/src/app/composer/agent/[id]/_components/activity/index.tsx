import { Suspense } from 'react';
import { Section } from '@/app/_components/layout/page-utils';
import type { RouterOutputs } from '@/trpc/client';
import { LoadingActivityCharts } from './charts';
import { Card } from '@/components/ui/card';
import { HydrateClient } from '@/trpc/server';
import { ActivityContent } from './content';

interface Props {
  agentConfiguration: NonNullable<RouterOutputs['public']['agents']['get']>;
}

export const Activity: React.FC<Props> = ({ agentConfiguration }) => {
  return (
    <HydrateClient>
      <ActivityContainer>
        <Suspense fallback={<LoadingActivityCharts />}>
          <ActivityContent agentConfiguration={agentConfiguration} />
        </Suspense>
      </ActivityContainer>
    </HydrateClient>
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
