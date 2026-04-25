import Link from 'next/link';
import { Suspense } from 'react';

import { Plus } from 'lucide-react';

import { HeadingContainer } from '../../../../_components/layout/page-utils';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

import { X402V2Badge } from '@/app/(app)/_components/x402/v2-badge';

import { X402LinkedSearchBox } from '@/app/(app)/_components/search/x402-linked-search-box';

export const HomeHeading = () => {
  return (
    <HeadingContainer className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <h1 className="text-2xl md:text-4xl font-bold font-mono">x402scan</h1>
          <X402V2Badge className="mt-1 text-sm" />
        </div>
        <p className="text-muted-foreground text-sm">
          The x402 analytics dashboard and block explorer
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-2 md:flex-row">
        <div className="w-full min-w-0 md:flex-1">
          <Suspense
            fallback={
              <div className="h-12 w-full rounded-md border bg-background shadow-xs" />
            }
          >
            <X402LinkedSearchBox
              autoFocus={false}
              layout="section"
              surface="x402scan_home"
            />
          </Suspense>
        </div>
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
