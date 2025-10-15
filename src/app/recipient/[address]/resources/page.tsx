import { Body, Heading } from '@/app/_components/layout/page-utils';
import { OriginInfoCard } from '@/app/_components/resources/display/origin-info-card';
import { ResourcesContainer } from '@/app/_components/resources/display/resources-container';

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
        description="Interactive x402 resources provided by this address"
      />
      <Body className="space-y-6">
        <OriginInfoCard origins={originsWithResources} address={address} />
        <ResourcesContainer originsWithResources={originsWithResources} />
      </Body>
    </HydrateClient>
  );
}
