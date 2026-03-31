import { Body } from '@/app/_components/layout/page-utils';
import { Suspense } from 'react';
import { HeaderCard, LoadingHeaderCard } from './_components/header';
import { Activity, LoadingActivity } from './_components/activity';
import {
  LatestTransactions,
  LoadingLatestTransactions,
} from './_components/transactions';
import { BuyerSellers, LoadingBuyerSellers } from './_components/sellers';
import { api } from '@/trpc/server';
import { ALL_TIME_TIMEFRAME } from '@/types/timeframes';

export default async function BuyerPage({
  params,
}: PageProps<'/buyer/[address]'>) {
  const { address } = await params;

  // Prefetch data for hydration
  await api.public.buyers.all.stats.overall.prefetch({
    senders: {
      include: [address],
    },
    timeframe: ALL_TIME_TIMEFRAME,
  });

  return (
    <Body className="gap-8 pt-0">
      <Suspense fallback={<LoadingHeaderCard />}>
        <HeaderCard address={address} />
      </Suspense>
      <Suspense fallback={<LoadingActivity />}>
        <Activity address={address} />
      </Suspense>
      <Suspense fallback={<LoadingBuyerSellers />}>
        <BuyerSellers address={address} />
      </Suspense>
      <Suspense fallback={<LoadingLatestTransactions />}>
        <LatestTransactions address={address} />
      </Suspense>
    </Body>
  );
}
