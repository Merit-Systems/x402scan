import { Body, Heading } from '@/app/_components/layout/page-utils';

import { LoadingLatestTransactionsTable } from '../_components/transactions';

export default function LoadingTransactionsPage() {
  const pageSize = 10;
  return (
    <div>
      <Heading
        title="Transactions"
        description="All x402 transactions through facilitators we track"
      />
      <Body>
        <LoadingLatestTransactionsTable loadingRowCount={pageSize} />
      </Body>
    </div>
  );
}
