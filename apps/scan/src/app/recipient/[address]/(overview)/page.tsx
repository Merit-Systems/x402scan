import { Body } from '@/app/_components/layout/page-utils';
import { Suspense } from 'react';
import { HeaderCard, LoadingHeaderCard } from './_components/header';
import { Activity, LoadingActivity } from './_components/activity';
import {
  LatestTransactions,
  LoadingLatestTransactions,
} from './_components/transactions';
import { connection } from 'next/server';

export default async function RecipientPage({
  params,
}: PageProps<'/recipient/[address]'>) {
  const { address } = await params;

  await connection();

  return (
    <Body className="gap-8 pt-0">
      <Suspense fallback={<LoadingHeaderCard />}>
        <HeaderCard address={address} />
      </Suspense>
      <Suspense fallback={<LoadingActivity />}>
        <Activity address={address} />
      </Suspense>
      <Suspense fallback={<LoadingLatestTransactions />}>
        <LatestTransactions address={address} />
      </Suspense>
    </Body>
  );
}
