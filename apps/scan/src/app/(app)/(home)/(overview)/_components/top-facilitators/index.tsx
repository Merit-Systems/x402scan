import { Suspense } from 'react';

import { api, HydrateClient } from '@/trpc/server';

import {
  LoadingTopFacilitatorsContent,
  TopFacilitatorsContent,
} from './content';

import { Section } from '@/app/_components/layout/page-utils';

import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

import { facilitatorAddresses, facilitators } from '@/lib/facilitators';

import { ActivityTimeframe } from '@/types/timeframes';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const TopFacilitators: React.FC<Props> = ({ chain }) => {
  const chainFacilitators = chain
    ? facilitators.filter(f => f.addresses[chain])
    : facilitatorAddresses;

  void api.public.stats.overall.prefetch({
    chain,
    timeframe: ActivityTimeframe.OneDay,
  });
  void api.public.facilitators.list.prefetch({
    chain,
    pagination: {
      page_size: chainFacilitators.length,
    },
    timeframe: ActivityTimeframe.OneDay,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <FacilitatorsSection>
          <Suspense fallback={<LoadingTopFacilitatorsContent />}>
            <TopFacilitatorsContent />
          </Suspense>
        </FacilitatorsSection>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingTopFacilitators = () => {
  return (
    <FacilitatorsSection>
      <LoadingTopFacilitatorsContent />
    </FacilitatorsSection>
  );
};

const FacilitatorsSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Top Facilitators"
      description="Analytics on facilitators processing x402 transfers"
      href="/facilitators"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
