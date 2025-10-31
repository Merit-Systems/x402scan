import { cn } from '@/lib/utils';
import { LoadingStatsCards, StatsCards } from './stat-cards';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  stats: RouterOutputs['public']['facilitators']['list']['items'][number];
}

export const FacilitatorStats: React.FC<Props> = ({ stats }) => {
  return (
    <OverallStatsContainer>
      <StatsCards stats={stats} />
    </OverallStatsContainer>
  );
};

export const LoadingFacilitatorStats = () => {
  return (
    <OverallStatsContainer>
      <LoadingStatsCards />
    </OverallStatsContainer>
  );
};

const OverallStatsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        'grid overflow-hidden h-full relative',
        'grid-cols-2 md:grid-cols-1',
        'rounded-b-lg md:rounded-bl-none md:rounded-r-lg',
        'border-t md:border-l md:border-t-0',
        '[&>*:nth-child(odd)]:border-r md:[&>*:nth-child(odd)]:border-r-0',
        '[&>*:nth-child(-n+2)]:border-b md:[&>*:not(:last-child)]:border-b'
      )}
    >
      {children}
    </div>
  );
};
