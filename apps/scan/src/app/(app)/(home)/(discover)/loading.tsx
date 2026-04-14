import { Body, Section } from '@/app/_components/layout/page-utils';

import { DiscoverHeading } from './_components/heading';
import { LoadingOverallStats } from '../(overview)/_components/stats';
import { LoadingDiscoverSellersTable } from './_components/discover-origins';

export default function LoadingDiscover() {
  return (
    <div>
      <DiscoverHeading />
      <Body>
        <LoadingOverallStats />
        <Section
          title="Top Sellers"
          description="x402Scan curated x402-enabled services."
        >
          <LoadingDiscoverSellersTable />
        </Section>
      </Body>
    </div>
  );
}
