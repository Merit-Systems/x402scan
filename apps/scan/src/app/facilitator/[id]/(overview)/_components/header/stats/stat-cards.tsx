import { Suspense } from 'react';
import { HydrateClient } from '@/trpc/server';
import { StatsCardsContent, LoadingStatsCards } from './content';

type Props = {
  id: string;
};

export const StatsCards: React.FC<Props> = ({ id }) => {
  return (
    <HydrateClient>
      <Suspense fallback={<LoadingStatsCards />}>
        <StatsCardsContent id={id} />
      </Suspense>
    </HydrateClient>
  );
};

export { LoadingStatsCards };
