import { notFound } from 'next/navigation';

import { Body } from '@/app/_components/layout/page-utils';

import { HeaderCard } from './_components/header';
import { Activity } from './_components/activity';
import { LatestTransactions } from './_components/transactions';

import { facilitatorIdMap } from '@/lib/facilitators';
import { api } from '@/trpc/server';
import { ActivityTimeframe } from '@/types/timeframes';

export default async function FacilitatorPage({
  params,
}: PageProps<'/facilitator/[id]'>) {
  const { id } = await params;
  const facilitator = facilitatorIdMap.get(id);
  if (!facilitator) {
    return notFound();
  }

  // Prefetch stats for hydration
  void api.public.stats.overall.prefetch({
    facilitatorIds: [id],
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <Body className="gap-8 pt-0">
      <HeaderCard facilitator={facilitator} />
      <Activity facilitatorId={id} />
      <LatestTransactions facilitatorId={id} />
    </Body>
  );
}
