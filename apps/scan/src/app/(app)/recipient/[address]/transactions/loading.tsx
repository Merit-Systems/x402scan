import { Body, Heading } from '@/app/_components/layout/page-utils';

import { LoadingLatestTransactionsTable } from '../_components/transactions/table';

export default function LoadingTransactionsPage() {
  return (
    <div>
      <Heading
        title="Transactions"
        description="x402 transactions to this server address"
      />
      <Body>
        <LoadingLatestTransactionsTable loadingRowCount={15} />
      </Body>
    </div>
  );
}
