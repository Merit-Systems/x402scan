import { Body } from '../../../_components/layout/page-utils';

import { HomeHeading } from '../(overview)/_components/heading';
import { OverallStats } from '../(overview)/_components/stats';
import { TopServers } from '../(overview)/_components/sellers/known-sellers';
import { TopFacilitators } from '../(overview)/_components/top-facilitators';
import { LatestTransactions } from '../(overview)/_components/latest-transactions';
import { AllSellers } from '../(overview)/_components/sellers/all-sellers';
import { AllBuyers } from '../(overview)/_components/buyers';
import { getChainForPage } from '@/app/(app)/_lib/chain/page';
import { TopAgents } from '../(overview)/_components/top-agents';


export default async function AllPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const chain = await getChainForPage(await searchParams);

  return (
    <div>
      <HomeHeading />
      <Body>
        <OverallStats chain={chain} />
        <TopServers chain={chain} />
        <TopFacilitators chain={chain} />
        <TopAgents />
        <LatestTransactions chain={chain} />
        <AllSellers chain={chain} />
        <AllBuyers chain={chain} />
      </Body>
    </div>
  );
}
