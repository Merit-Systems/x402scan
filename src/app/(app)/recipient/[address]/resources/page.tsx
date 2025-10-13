import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';

import { ResourcesByOrigin } from '@/app/(app)/_components/resources/by-origin';

import { api, HydrateClient } from '@/trpc/server';

export default async function ResourcesPage({
  params,
}: PageProps<'/recipient/[address]/resources'>) {
  const { address } = await params;

  const originsWithResources =
    await api.origins.list.withResources.byAddress(address);

  return (
    <HydrateClient>
      <Heading
        title="Resources"
        description="Resources provided by this address grouped by server origin"
      />
      <Body className="gap-0">
        <ResourcesByOrigin originsWithResources={originsWithResources} />
      </Body>
    </HydrateClient>
  );
}
