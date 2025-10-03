import { Body, HeadingContainer } from '../../_components/layout/page-utils';

import { SearchButton } from './_components/search-button';
import { AllSellers } from './_components/sellers/all-sellers';
import { OverallStats } from './_components/stats';
import { TopServers } from './_components/sellers/known-sellers';
import { LatestTransactions } from './_components/latest-transactions';
import { TopFacilitators } from './_components/top-facilitators';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <div>
      <HeadingContainer className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-4xl font-bold font-mono">x402scan</h1>
          <p className="text-muted-foreground text-sm">
            The x402 analytics dashboard and block explorer
          </p>
        </div>
        <SearchButton />
      </HeadingContainer>
      <Body>
        <OverallStats />
        <TopServers />
        <TopFacilitators />
        <LatestTransactions />
        <AllSellers />
      </Body>
    </div>
  );
}
