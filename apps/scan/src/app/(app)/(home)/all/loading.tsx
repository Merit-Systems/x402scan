import { Body } from '../../../_components/layout/page-utils';

import { HomeHeading } from '../(overview)/_components/heading';
import { LoadingTopServers } from '../(overview)/_components/sellers/known-sellers';
import { LoadingLatestTransactions } from '../(overview)/_components/latest-transactions';
import { LoadingTopFacilitators } from '../(overview)/_components/top-facilitators';
import { LoadingOverallStats } from '../(overview)/_components/stats';
import { LoadingAllSellers } from '../(overview)/_components/sellers/all-sellers';
import { LoadingAllBuyers } from '../(overview)/_components/buyers';

export default function LoadingAll() {
  const pageSize = 10;
  return (
    <div>
      <HomeHeading />
      <Body>
        <LoadingOverallStats />
        <LoadingTopServers />
        <LoadingTopFacilitators />
        <LoadingLatestTransactions loadingRowCount={pageSize} />
        <LoadingAllSellers />
        <LoadingAllBuyers />
      </Body>
    </div>
  );
}
