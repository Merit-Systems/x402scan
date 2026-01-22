import { Fragment } from 'react';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import { Separator } from '@/components/ui/separator';

import { OriginsCarousel } from './_components/carousel';
import { ServersCharts } from './_components/charts';

import { MARKETPLACE_CAROUSELS } from './carousels';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';

import { ActivityTimeframe } from '@/types/timeframes';

export default function MarketplacePage() {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
      <Heading
        title="Marketplace"
        description="Explore the most popular x402 servers"
        actions={<RangeSelector />}
      />
      <Body>
        <ServersCharts />
        {MARKETPLACE_CAROUSELS.map((carousel, index) => (
          <Fragment key={carousel.sectionProps.title}>
            {index !== 0 && <Separator />}
            <OriginsCarousel
              sectionProps={carousel.sectionProps}
              input={carousel.input}
              hideCount={carousel.hideCount}
            />
          </Fragment>
        ))}
      </Body>
    </TimeRangeProvider>
  );
}
