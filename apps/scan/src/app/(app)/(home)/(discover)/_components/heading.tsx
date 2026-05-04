import Link from 'next/link';

import { Plus } from 'lucide-react';

import { HeadingContainer } from '../../../../_components/layout/page-utils';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

import { DiscoverSearchInput, DiscoverSearchSubmit } from './discover-search';

export const DiscoverHeading = () => {
  return (
    <HeadingContainer className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Logo className="size-8" />
            <h1 className="text-2xl md:text-4xl font-bold font-mono">
              x402scan
            </h1>
          </div>
          <Link href="/resources/register" className="hidden md:block shrink-0">
            <Button size="sm" className="h-9">
              <Plus className="size-4" />
              Register Resource
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">
          The x402 analytics dashboard and block explorer
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2">
        <DiscoverSearchInput />
        <DiscoverSearchSubmit />
      </div>
      <Link href="/resources/register" className="md:hidden">
        <Button size="sm" className="w-full h-9">
          <Plus className="size-4" />
          Register Resource
        </Button>
      </Link>
    </HeadingContainer>
  );
};
