import { Body } from '@/app/_components/layout/page-utils';

import { LoadingHeaderCard } from './_components/header';
import { LoadingActivity } from './_components/activity';
import { LoadingLatestTransactions } from './_components/transactions';

export default async function LoadingFacilitatorPage() {
  return (
    <Body className="gap-0 pt-0">
      <LoadingHeaderCard />
      <LoadingActivity />
      <LoadingLatestTransactions />
    </Body>
  );
}
