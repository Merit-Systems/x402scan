import { Body } from '@/app/_components/layout/page-utils';

import {
  LoadingResourcesByOrigin,
  ResourcesByOrigin,
} from '@/app/(app)/_components/resources/by-origin';
import { getChainForPage } from '@/app/(app)/_lib/chain/page';

import { api, HydrateClient } from '@/trpc/server';
import { ResourcesHeading } from './_components/heading';
import { Suspense } from 'react';

export default async function ResourcesPage({
  params,
  searchParams,
}: PageProps<'/recipient/[address]/resources'>) {
  const { address } = await params;
  const chain = await getChainForPage(await searchParams);

  // Prefetch resources for hydration
  void api.public.origins.list.withResources.prefetch({ chain, address });

  return (
    <HydrateClient>
      <ResourcesHeading />
      <Body className="gap-0">
        <Suspense fallback={<LoadingResourcesByOrigin />}>
          <ResourcesByOrigin
            emptyText="No resources found for this address"
            address={address}
          />
        </Suspense>
      </Body>
    </HydrateClient>
  );
}
