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
        <Suspense fallback={<LoadingOriginResources />}>
          <OriginResources originId={id} />
        </Suspense>
      </Body>
    </HydrateClient>
  );
}
