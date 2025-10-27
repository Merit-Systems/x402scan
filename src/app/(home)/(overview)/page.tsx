import { Body } from '../../_components/layout/page-utils';

import { HomeHeading } from './_components/heading';
import { OverallStats } from './_components/stats';
import {
  TopServers,
  LoadingTopServers,
} from './_components/sellers/known-sellers';
import { TopFacilitators } from './_components/top-facilitators';
import {
  LatestTransactions,
  LoadingLatestTransactions,
} from './_components/latest-transactions';
import {
  AllSellers,
  LoadingAllSellers,
} from './_components/sellers/all-sellers';
import { ComposerCallout } from './_components/composer-callout';
import { getChain } from '@/app/_lib/chain';
import { Suspense } from 'react';
import { LoadingTopFacilitators } from './_components/top-facilitators/loading';
import { env } from '@/env';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const chain = await searchParams.then(params => getChain(params.chain));
  return (
    <div>
      <HomeHeading />
      <Body>
        {env.NEXT_PUBLIC_ENABLE_COMPOSER === 'true' && <ComposerCallout />}
        <OverallStats chain={chain} />
        <Suspense fallback={<LoadingTopServers />}>
          <TopServers chain={chain} />
        </Suspense>
        <Suspense fallback={<LoadingTopFacilitators />}>
          <TopFacilitators chain={chain} />
        </Suspense>
        <Suspense fallback={<LoadingLatestTransactions />}>
          <LatestTransactions chain={chain} />
        </Suspense>
        <Suspense fallback={<LoadingAllSellers />}>
          <AllSellers chain={chain} />
        </Suspense>
      </Body>
    </div>
  );
}
