import { Body, Heading } from '../../_components/layout/page-utils';
import { api } from '@/trpc/server';
import { ResourcesByOrigin } from '@/app/_components/resources/by-origin';
import {
  AddOnChainResourceDialog,
  AddResourcesDialog,
} from '@/app/_components/add-resources';

export default async function ResourcesPage() {
  const resources = await api.origins.list.withResources.all();

  return (
    <div>
      <Heading
        title="All Resources"
        description="x402 resources registered on x402scan. Coinbase Bazaar resources are automatically registered."
        actions={
          <>
            <AddResourcesDialog />
            <AddOnChainResourceDialog />
          </>
        }
      />
      <Body>
        <ResourcesByOrigin originsWithResources={resources} />
      </Body>
    </div>
  );
}
