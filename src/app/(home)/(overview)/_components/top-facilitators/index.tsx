import { api, HydrateClient } from '@/trpc/server';
import { Suspense } from 'react';
import { TopFacilitatorsContent } from './content';
import { LoadingTopFacilitators } from './loading';
import { facilitatorAddresses, facilitators } from '@/lib/facilitators';
import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const TopFacilitators: React.FC<Props> = async ({ chain }: Props) => {
  // Get facilitators for the default chain
  const chainFacilitators = chain
    ? facilitators.flatMap(f => f.addresses[chain] ?? [])
    : facilitatorAddresses;

  // Prefetch all data including chart data for each facilitator
  await Promise.all([
    api.public.stats.overall.prefetch({ chain }),
    api.public.facilitators.list.prefetch({
      chain,
      pagination: {
        page_size: chainFacilitators.length,
      },
    }),
    ...chainFacilitators.map(id =>
      api.public.stats.bucketed.prefetch({
        numBuckets: 48,
        facilitatorIds: [id],
        chain,
      })
    ),
  ]);

  return (
    <HydrateClient>
      <Suspense fallback={<LoadingTopFacilitators />}>
        <TopFacilitatorsContent />
      </Suspense>
    </HydrateClient>
  );
};
