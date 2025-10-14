import Link from 'next/link';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Body, Heading } from '../../_components/layout/page-utils';

import { ResourcesByOrigin } from '@/app/(app)/_components/resources/by-origin';

import { api } from '@/trpc/server';

export default async function ResourcesPage() {
  const resources = await api.origins.list.withResources.all();

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
