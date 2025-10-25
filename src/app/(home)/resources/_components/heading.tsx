import { Heading } from '@/app/_components/layout/page-utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const ResourcesHeading = () => {
  return (
    <Heading
      title="All Resources"
      description="x402 resources registered on x402scan. Resources that are discoverable from facilitator are automatically registered."
      actions={
        <Link href="/resources/register">
          <Button variant="turbo">
            <Plus className="size-4" />
            Register Resource
          </Button>
        </Link>
      }
    />
  );
};
