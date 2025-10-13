import { Plus } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

import { Body, HeadingContainer } from '../../_components/layout/page-utils';
import { LoadingAllSellers } from './_components/sellers/all-sellers';
import { LoadingOverallStats } from './_components/stats';
import { LoadingTopServers } from './_components/sellers/known-sellers';
import { LoadingLatestTransactions } from './_components/latest-transactions';
import { SearchButtonContent } from './_components/search-button';
import { LoadingTopFacilitators } from './_components/top-facilitators';

export default function LoadingOverview() {
  return (
    <div>
      <HeadingContainer className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Logo className="size-8" />
            <h1 className="text-2xl md:text-4xl font-bold font-mono">
              x402scan
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            The x402 analytics dashboard and block explorer
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <SearchButtonContent />
          <Button
            variant="turbo"
            className="shrink-0 w-full md:w-fit px-4"
            size="lg"
          >
            <Plus className="size-4" />
            Register Resource
          </Button>
        </div>
      </HeadingContainer>
      <Body>
        <LoadingOverallStats />
        <LoadingTopServers />
        <LoadingTopFacilitators />
        <LoadingLatestTransactions />
        <LoadingAllSellers />
      </Body>
    </div>
  );
}
