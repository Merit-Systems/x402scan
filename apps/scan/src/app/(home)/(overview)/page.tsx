import { Body } from '../../_components/layout/page-utils';

import { HomeHeading } from './_components/heading';
import { OverallStats } from './_components/stats';
import { TopServers } from './_components/sellers/known-sellers';
import { TopFacilitators } from './_components/top-facilitators';
import { LatestTransactions } from './_components/latest-transactions';
import { AllSellers } from './_components/sellers/all-sellers';
import { ComposerCallout } from './_components/composer-callout';
import { getChain } from '@/app/_lib/chain';
import { TopAgents } from './_components/top-agents';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const chain = await searchParams.then(params => getChain(params.chain));
  return (
    <div>
      <HomeHeading />
      <Body>
        <ComposerCallout />
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
