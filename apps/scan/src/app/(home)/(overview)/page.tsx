import { Body } from '../../_components/layout/page-utils';

import { HomeHeading } from './_components/heading';
import { OverallStats } from './_components/stats';
import { TopServers } from './_components/sellers/known-sellers';
import { TopFacilitators } from './_components/top-facilitators';
import { LatestTransactions } from './_components/latest-transactions';
import { AllSellers } from './_components/sellers/all-sellers';
import { getChainForPage } from '@/app/_lib/chain/page';
import { TopAgents } from './_components/top-agents';
import { V2AnnouncementBanner } from '../_components/v2-announcement-banner';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const chain = await getChainForPage(await searchParams);

  return (
    <div>
      <HomeHeading />
      <Body>
        <V2AnnouncementBanner />
        <OverallStats chain={chain} />
        <TopServers chain={chain} />
        <TopFacilitators chain={chain} />
        <TopAgents />
        <LatestTransactions chain={chain} />
        <AllSellers chain={chain} />
      </Body>
    </div>
  );
}
