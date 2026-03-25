import { Body } from '@/app/_components/layout/page-utils';

import { LoadingHeaderCard } from './_components/header';
import { LoadingActivity } from './_components/activity';
import { LoadingLatestTransactions } from './_components/transactions';
import { LoadingBuyerSellers } from './_components/sellers';

export default function LoadingBuyerPage() {
  return (
    <Body className="gap-8 pt-0">
      <LoadingHeaderCard />
      <LoadingActivity />
      <LoadingBuyerSellers />
      <LoadingLatestTransactions />
    </Body>
  );
}
