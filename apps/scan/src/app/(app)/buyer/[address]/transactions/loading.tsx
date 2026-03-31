import { Body, Heading } from '@/app/_components/layout/page-utils';

import { LoadingLatestTransactionsTable } from '../_components/transactions/table';

export default function LoadingBuyerTransactionsPage() {
  return (
    <div>
      <Heading
        title="Transactions"
        description="x402 transactions from this buyer address"
      />
      <Body>
        <LoadingLatestTransactionsTable loadingRowCount={15} />
      </Body>
    </div>
  );
}
