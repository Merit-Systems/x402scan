import { Body } from '../../_components/layout/page-utils';
import { api, HydrateClient } from '@/trpc/server';
import {
  LoadingResourcesByOrigin,
  ResourcesByOrigin,
} from '@/app/_components/resources/by-origin';
import { getChain } from '@/app/_lib/chain';
import { Suspense } from 'react';
import { ResourcesHeading } from './_components/heading';

export default async function ResourcesPage({
  searchParams,
}: PageProps<'/resources'>) {
  const chain = await searchParams.then(params => getChain(params.chain));

  await api.public.origins.list.withResources.prefetch({ chain });

  return (
    <HydrateClient>
      <ResourcesHeading />
      <Body>
        <Suspense fallback={<LoadingResourcesByOrigin loadingRowCount={6} />}>
          <ResourcesByOrigin emptyText="No resources found" />
        </Suspense>
      </Body>
    </HydrateClient>
  );
}
