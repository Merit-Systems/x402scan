import { Body, Heading } from '../../_components/layout/page-utils';
import { api } from '@/trpc/server';
import { OriginCarousel } from '@/app/_components/resources/display/origin-carousel';
import { OriginsTable } from '@/app/_components/resources/display/origins-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ResourcesPage() {
  const [
    allResources,
    mostPopularAllTime,
    mostPopularThisWeek,
    newestOrigins
  ] = await Promise.all([
    api.origins.list.withResources.all(),
    api.origins.featured.mostPopularAllTime(),
    api.origins.featured.mostPopularThisWeek(),
    api.origins.featured.newest(),
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
        <OriginCarousel 
          title="Most Popular All Time" 
          origins={mostPopularAllTime}
          featured
        />
        
        <OriginCarousel 
          title="Trending This Week" 
          origins={mostPopularThisWeek}
          compact
          autoplay={false}
        />
        
        <OriginCarousel 
          title="Newest Origins" 
          origins={newestOrigins}
          compact
          autoplay={false}
        />
        
        <OriginsTable origins={allResources} />
      </Body>
    </div>
  );
}
