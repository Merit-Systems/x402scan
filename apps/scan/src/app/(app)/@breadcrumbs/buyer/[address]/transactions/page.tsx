import { ArrowLeftRight } from 'lucide-react';

import { Breadcrumb } from '../../../_components/breadcrumb';
import { Separator } from '../../../_components/separator';

export default async function BuyerTransactionsBreadcrumb({
  params,
}: PageProps<'/buyer/[address]/transactions'>) {
  const { address } = await params;
  return (
    <>
      <Separator />
      <Breadcrumb
        href={`/buyer/${address}/transactions`}
        image={null}
        name="Transactions"
        Fallback={ArrowLeftRight}
      />
    </>
  );
}
