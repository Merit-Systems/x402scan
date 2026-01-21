'use client';

import { api } from '@/trpc/client';
import { useChain } from '@/app/(app)/_contexts/chain/hook';
import { FacilitatorCard, LoadingFacilitatorCard } from './_components/card';
import { cn } from '@/lib/utils';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { facilitatorAddresses, facilitators } from '@/lib/facilitators';

export const TopFacilitatorsContent = () => {
  const { chain } = useChain();
  const { timeframe } = useTimeRangeContext();
  const chainFacilitators = chain
    ? facilitators.filter(f => f.addresses[chain])
    : facilitatorAddresses;

  const [facilitatorsData] = api.public.facilitators.list.useSuspenseQuery({
    chain,
    pagination: {
      page_size: chainFacilitators.length,
    },
    timeframe,
  });

  return (
    <div
      className={cn(
        `grid grid-cols-1 gap-4`,
        facilitatorsData.items.length < 2 ? 'md:grid-cols-1' : 'md:grid-cols-2',
        facilitatorsData.items.length < 3 ? 'md:grid-cols-2' : 'md:grid-cols-3'
      )}
    >
      {facilitatorsData.items.slice(0, 3).map(stats => (
        <FacilitatorCard
          key={stats.facilitator_id}
          facilitator={stats.facilitator}
          stats={stats}
        />
      ))}
    </div>
  );
};

export const LoadingTopFacilitatorsContent = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <LoadingFacilitatorCard key={index} />
      ))}
    </div>
  );
};
