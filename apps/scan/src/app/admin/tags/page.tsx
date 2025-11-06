import { Body, Heading } from '@/app/_components/layout/page-utils';
import { ResourceTable } from './_components/resource-table';
import { ResourceCharts } from './_components/resource-charts';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { ResourcesSortingProvider } from '@/app/_contexts/sorting/resource-tags/provider';
import { defaultResourcesSorting } from '@/app/_contexts/sorting/resource-tags/default';
import { ActivityTimeframe } from '@/types/timeframes';
import { subDays } from 'date-fns';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';

export default async function ResourcesPage() {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
      <ResourcesSortingProvider initialSorting={defaultResourcesSorting}>
        <div>
          <Heading
            title="Resource Tagging"
            description="Tag resources with categories to help users find them."
            actions={<RangeSelector />}
          />
          <Body>
            <ResourceCharts />
            <div className="mt-8">
              <ResourceTable />
            </div>
          </Body>
        </div>
      </ResourcesSortingProvider>
    </TimeRangeProvider>
  );
}
