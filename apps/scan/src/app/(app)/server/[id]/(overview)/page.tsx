import { Suspense } from 'react';
import { HeaderCard, LoadingHeaderCard } from './_components/header';
import { api, HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';
import {
  LoadingOriginResources,
  OriginResources,
} from './_components/resources';
import { LoadingOriginActivity, OriginActivity } from './_components/activity';
import { LoadingOriginAgents, OriginAgents } from './_components/agents';
import { ALL_TIME_TIMEFRAME } from '@/types/timeframes';
import { defaultAgentsSorting } from '@/app/(app)/_contexts/sorting/agents/default';

export default async function OriginPage({
  params,
}: PageProps<'/server/[id]'>) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);
  if (!origin) {
    return notFound();
  }

  await Promise.all([
    api.public.origins.getMetadata.prefetch(id),
    api.public.origins.list.withResources.prefetch({ originIds: [id] }),
    api.public.agents.list.prefetch({
      originId: id,
      timeframe: ALL_TIME_TIMEFRAME,
      pagination: { page: 0, page_size: 6 },
      sorting: defaultAgentsSorting,
    }),
  ]);

  return (
    <HydrateClient>
      <Body className="pt-0">
        <Suspense fallback={<LoadingHeaderCard />}>
          <HeaderCard origin={origin} />
        </Suspense>
        <Suspense fallback={<LoadingOriginActivity />}>
          <OriginActivity originId={id} />
        </Suspense>
        <div className="md:grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
            <Suspense fallback={<LoadingOriginResources />}>
              <OriginResources originId={id} />
            </Suspense>
          </div>
          <div className="col-span-1">
            <Suspense fallback={<LoadingOriginAgents />}>
              <OriginAgents originId={id} />
            </Suspense>
          </div>
        </div>
      </Body>
    </HydrateClient>
  );
}
