import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Address } from '@/components/ui/address';
import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { TransactionGraphic } from './_components/graphic';
import { TransactionDetails } from './_components/details';

export default async function TransactionPage({
  params,
}: PageProps<'/transaction/[hash]'>) {
  const { hash } = await params;

  const [transaction, transfer] = await Promise.all([
    api.transactions.get({ transaction_hash: hash }),
    api.transfers.get({ transaction_hash: hash }),
  ]);

  if (!transaction || !transfer) {
    return notFound();
  }

  return (
    <div>
      <Heading
        title="Transaction Details"
        description={
          <Address address={hash} className="text-sm" side="bottom" />
        }
      />
      <Body>
        <TransactionGraphic
          buyerAddress={transfer.sender}
          facilitatorAddress={transaction.from_address}
          sellerAddress={transfer.recipient}
          amount={BigInt(transfer.amount)}
        />
        <TransactionDetails transaction={transaction} transfer={transfer} />
      </Body>
    </div>
  );
}
