import Link from 'next/link';

import { Plus } from 'lucide-react';

import { HeadingContainer } from '../../../_components/layout/page-utils';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

import { SearchButton } from './search-button';

export const HomeHeading = () => {
  return (
    <HeadingContainer className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <h1 className="text-2xl md:text-4xl font-bold font-mono">x402scan</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          The x402 analytics dashboard and block explorer
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2">
        <SearchButton />
        <Link
          href="/resources/register"
          className="w-full md:w-fit hidden md:block"
        >
          <Button
            variant="outline"
            className="shrink-0 w-full md:w-fit px-4"
            size="lg"
          >
            <Plus className="size-4" />
            Register Resource
          </Button>
        </Link>
      </div>
    </HeadingContainer>
  );
};
