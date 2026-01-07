import { Suspense } from 'react';
import { HydrateClient } from '@/trpc/server';
import { StatsCardsContent, LoadingStatsCards } from './content';

interface Props {
  address: string;
}

export const StatsCards: React.FC<Props> = ({ address }) => {
  return (
    <HydrateClient>
      <Suspense fallback={<LoadingStatsCards />}>
        <StatsCardsContent address={address} />
      </Suspense>
    </HydrateClient>
  );
};

export { LoadingStatsCards };
