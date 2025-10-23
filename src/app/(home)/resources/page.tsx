import { Body, Heading } from '../../_components/layout/page-utils';
import { api } from '@/trpc/server';
import { ResourcesByOrigin } from '@/app/_components/resources/by-origin';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getChain } from '@/app/_lib/chain';

export default async function ResourcesPage({
  searchParams,
}: PageProps<'/resources'>) {
  const chain = await searchParams.then(params => getChain(params.chain));
  const resources = await api.origins.list.withResources.all({ chain });

  return (
    <div>
      <Heading
        title="All Resources"
        description="x402 resources registered on x402scan. Coinbase Bazaar resources are automatically registered."
        actions={
          <Link href="/resources/register">
            <Button variant="turbo">
              <Plus className="size-4" />
              Register Resource
            </Button>
          </Link>
        }
      />
      <Body>
        <ResourcesByOrigin originsWithResources={resources} />
      </Body>
    </div>
  );
}
