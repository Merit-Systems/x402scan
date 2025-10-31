import { Body, Heading } from '@/app/_components/layout/page-utils';

import { Card } from '@/components/ui/card';

import { LoadingFacilitatorsChart } from './_components/chart';
import { LoadingFacilitatorsTable } from './_components/facilitators';
import { RangeSelector } from '@/app/_contexts/time-range/component';

export default async function FacilitatorsPage() {
  return (
    <div>
      <Heading
        title="Facilitators"
        description="Top facilitators processing x402 transactions"
        actions={<RangeSelector />}
      />
      <Body>
        <Card className="overflow-hidden">
          <LoadingFacilitatorsChart />
        </Card>
        <LoadingFacilitatorsTable />
      </Body>
    </div>
  );
}
