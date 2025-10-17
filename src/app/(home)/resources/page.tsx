import { Body, Heading } from '../../_components/layout/page-utils';
import { api } from '@/trpc/server';
import { OriginCarousel } from '@/app/(home)/resources/_components/origin-carousel';
import { OriginsTable } from '@/app/(home)/resources/_components/origins-table';
import { ResourceSearchBar } from '@/app/(home)/resources/_components/search-bar';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subMonths } from 'date-fns';

export default async function ResourcesPage() {
  const [allResources, mostPopularAllTime] = await Promise.all([
    api.origins.list.withResources.all(),
    api.origins.list.aggregated({
      sorting: { id: 'tx_count', desc: true },
      startDate: subMonths(new Date(), 1),
      limit: 6,
      endDate: new Date(),
      aggregateBy: 'tx_count',
      hasOgImage: true,
    }),
  ]);

  return (
    <div>
      <Heading
        title="Resource Marketplace"
        description="Discover and interact with x402 resources. Coinbase Bazaar resources are automatically registered."
        actions={
          <Link href="/resources/register">
            <Button variant="turbo">
              <Plus className="size-4" />
              Register Resource
            </Button>
          </Link>
        }
      />
      <Body className="space-y-5">
        <ResourceSearchBar popularOrigins={mostPopularAllTime.items} />

        <OriginCarousel
          title="Most Popular This Month"
          origins={mostPopularAllTime.items}
        />

        <OriginsTable origins={allResources} />
      </Body>
    </div>
  );
}
