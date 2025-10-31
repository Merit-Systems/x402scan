import { Body, Heading } from '@/app/_components/layout/page-utils';

import { LoadingLatestTransactionsTable } from '../_components/transactions/table';

export default function LoadingTransactionsPage() {
  return (
    <div>
      <Heading
        title="Transactions"
        description="Transactions made through this facilitator"
      />
      <Body>
        <LoadingLatestTransactionsTable loadingRowCount={15} />
      </Body>
    </div>
  );
}
