import { Suspense } from 'react';
import { StatsCardsContent, LoadingStatsCards } from './content';

interface Props {
  address: string;
}

export const OverallBuyerStats: React.FC<Props> = ({ address }) => {
  return (
    <Suspense fallback={<LoadingStatsCards />}>
      <StatsCardsContent address={address} />
    </Suspense>
  );
};

export const LoadingOverallBuyerStats = () => {
  return <LoadingStatsCards />;
};
