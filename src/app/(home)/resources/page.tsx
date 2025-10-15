import { Body, Heading } from '../../_components/layout/page-utils';
import { api } from '@/trpc/server';
import { FeaturedCarousel } from '@/app/_components/resources/display/featured-carousel';
import { AppStoreGrid } from '@/app/_components/resources/display/app-store-grid';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ResourcesPage() {
  const resources = await api.origins.list.withResources.all();
  
  // Select featured resources (first 6 with most resources)
  const featuredOrigins = resources
    .sort((a, b) => b.resources.length - a.resources.length)
    .slice(0, 6);

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
      <Body className="space-y-8">
        {featuredOrigins.length > 0 && (
          <FeaturedCarousel featuredOrigins={featuredOrigins} />
        )}
        
        <div>
          <h2 className="text-xl font-semibold mb-4">All Origins</h2>
          <AppStoreGrid origins={resources} />
        </div>
      </Body>
    </div>
  );
}
