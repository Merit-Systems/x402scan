import { Body, HeadingContainer } from '../../_components/layout/page-utils';

import { SearchButton } from './_components/search-button';
import { AllSellers } from './_components/sellers/all-sellers';
import { OverallStats } from './_components/stats';
import { TopServers } from './_components/sellers/known-sellers';
import { LatestTransactions } from './_components/latest-transactions';
import { TopFacilitators } from './_components/top-facilitators';
import { Logo } from '@/components/logo';
import { Banner } from './_components/banner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  return (
    <div>
      <div className="-mt-6 md:-mt-8 mb-6 md:mb-8">
        <Banner />
      </div>
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
          <SearchButton />
          <Link href="/resources/register" className="w-full md:w-fit">
            <Button
              variant="turbo"
              className="shrink-0 w-full md:w-fit px-4"
              size="lg"
            >
              <Plus className="size-4" />
              Register Resource
            </Button>
          </Link>
        </div>
      </HeadingContainer>
      <Body>
        <OverallStats />
        <TopServers />
        <TopFacilitators />
        <LatestTransactions />
        <AllSellers />
      </Body>
    </div>
  );
}
