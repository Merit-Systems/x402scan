import { Body } from '../../_components/layout/page-utils';

import { HomeHeading } from './_components/heading';
import { ComposerCallout } from './_components/composer-callout';
import { LoadingTopServers } from './_components/sellers/known-sellers';
import { LoadingLatestTransactions } from './_components/latest-transactions';
import { LoadingTopFacilitators } from './_components/top-facilitators';
import { LoadingOverallStats } from './_components/stats';
import { LoadingAllSellers } from './_components/sellers/all-sellers';
import { env } from '@/env';
import { LoadingTopAgents } from './_components/top-agents';

export default function LoadingOverview() {
  return (
    <div>
      <HomeHeading />
      <Body>
        {env.NEXT_PUBLIC_ENABLE_COMPOSER === 'true' && <ComposerCallout />}
        <LoadingOverallStats />
        <LoadingTopServers />
        <LoadingTopFacilitators />
        <LoadingTopAgents />
        <LoadingLatestTransactions />
        <LoadingAllSellers />
      </Body>
    </div>
  );
}
