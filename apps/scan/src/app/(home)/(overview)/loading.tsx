import { Body } from '../../_components/layout/page-utils';

import { HomeHeading } from './_components/heading';
import { LoadingTopServers } from './_components/sellers/known-sellers';
import { LoadingLatestTransactions } from './_components/latest-transactions';
import { LoadingTopFacilitators } from './_components/top-facilitators';
import { LoadingOverallStats } from './_components/stats';
import { LoadingAllSellers } from './_components/sellers/all-sellers';
import { LoadingTopAgents } from './_components/top-agents';

export default function LoadingOverview() {
  const pageSize = 10;
  return (
    <div>
      <HomeHeading />
      <Body>
        <LoadingOverallStats />
        <LoadingTopServers />
        <LoadingTopFacilitators />
        <LoadingTopAgents />
        <LoadingLatestTransactions loadingRowCount={pageSize} />
        <LoadingAllSellers />
      </Body>
    </div>
  );
}
