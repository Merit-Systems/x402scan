import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card } from '@/components/ui/card';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { LoadingNetworksChart } from './_components/chart';
import { LoadingNetworksTable } from './_components/networks';

export default function LoadingNetworksPage() {
  return (
    <>
      <Heading
        title="Networks"
        description="Top networks processing x402 transactions"
        actions={<RangeSelector />}
      />
      <Body>
        <Card className="overflow-hidden">
          <LoadingNetworksChart />
        </Card>
        <LoadingNetworksTable />
      </Body>
    </>
  );
}
