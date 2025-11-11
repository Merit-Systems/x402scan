import { Suspense } from 'react';

import { api, HydrateClient } from '@/trpc/server';

import {
  LoadingTopFacilitatorsContent,
  TopFacilitatorsContent,
} from './content';

import { Section } from '@/app/_components/layout/page-utils';

import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { firstTransfer } from '@/services/facilitator/constants';

import { ActivityTimeframe } from '@/types/timeframes';

import { getSSRTimeRange } from '@/lib/time-range';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const TopFacilitators: React.FC<Props> = async ({ chain }: Props) => {
  await Promise.all([
    // Use MV for current period (OneDay is supported)
    api.public.stats.overallMv.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      chain,
    }),
    api.public.facilitators.list.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      chain,
      pagination: {
        page_size: 3,
      },
    }),
  ]);

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
