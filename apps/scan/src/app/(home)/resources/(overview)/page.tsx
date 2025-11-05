import { Fragment } from 'react';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import { Separator } from '@/components/ui/separator';

import { OriginsCarousel } from './_components/carousel';

import { MARKETPLACE_CAROUSELS } from './carousels';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { ActivityTimeframe } from '@/types/timeframes';
import { firstTransfer } from '@/services/facilitator/constants';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { ServersCharts } from './_components/charts';
import { getSSRTimeRange } from '@/lib/time-range';

export default async function MarketplacePage() {
  const { endDate, startDate } = getSSRTimeRange(
    ActivityTimeframe.OneDay,
    firstTransfer
  );

  return (
    <TimeRangeProvider
      creationDate={firstTransfer}
      initialTimeframe={ActivityTimeframe.OneDay}
    >
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
              startDate={startDate}
              endDate={endDate}
            />
          </Fragment>
        ))}
      </Body>
    </TimeRangeProvider>
  );
}
