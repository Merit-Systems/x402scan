import { Body } from '@/app/_components/layout/page-utils';

import {
  LoadingResourcesByOrigin,
  ResourcesByOrigin,
} from '@/app/_components/resources/by-origin';
import { getChain } from '@/app/_lib/chain';

import { api, HydrateClient } from '@/trpc/server';
import { ResourcesHeading } from './_components/heading';
import { Suspense } from 'react';

export default async function ResourcesPage({
  params,
  searchParams,
}: PageProps<'/recipient/[address]/resources'>) {
  const { address } = await params;
  const chain = await searchParams.then(params => getChain(params.chain));

  const origins = await api.public.origins.list.origins({
    chain,
    address,
  });

  await api.public.origins.list.withResources.prefetch({ chain, address });

  return (
    <HydrateClient>
      <ResourcesHeading />
      <Body className="gap-0">
        <Suspense
          fallback={
            <LoadingResourcesByOrigin loadingRowCount={origins.length} />
          }
        >
          <ResourcesByOrigin
            emptyText="No resources found for this address"
            address={address}
            defaultOpenOrigins={origins.map(origin => origin.id)}
          />
        </Suspense>
      </Body>
    </HydrateClient>
  );
}
