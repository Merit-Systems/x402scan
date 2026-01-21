import { Suspense } from 'react';
import { StatsCardsContent, LoadingStatsCards } from './content';

interface Props {
  address: string;
}

export const StatsCards: React.FC<Props> = ({ address }) => {
  return (
    <Suspense fallback={<LoadingStatsCards />}>
      <StatsCardsContent address={address} />
    </Suspense>
  );
};

export { LoadingStatsCards };
