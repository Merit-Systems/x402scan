import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { Body } from '@/app/_components/layout/page-utils';

import { HeaderCard, LoadingHeaderCard } from './_components/header';
import { Activity, LoadingActivity } from './_components/activity';
import {
  LatestTransactions,
  LoadingLatestTransactions,
} from './_components/transactions';

import { facilitatorIdMap } from '@/lib/facilitators';

export default async function FacilitatorPage({
  params,
}: PageProps<'/facilitator/[id]'>) {
  const { id } = await params;
  const facilitator = facilitatorIdMap.get(id);
  if (!facilitator) {
    return notFound();
  }
  return (
    <Body className="gap-8 pt-0">
      <Suspense fallback={<LoadingHeaderCard />}>
        <HeaderCard facilitator={facilitator} />
      </Suspense>
      <Suspense fallback={<LoadingActivity />}>
        <Activity facilitatorId={id} />
      </Suspense>
      <Suspense fallback={<LoadingLatestTransactions />}>
        <LatestTransactions facilitatorId={id} />
      </Suspense>
    </Body>
  );
}
