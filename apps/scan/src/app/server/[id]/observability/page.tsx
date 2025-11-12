import { api, HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';
import { StatusChartWrapper } from './_components/status-chart-wrapper';
import { ErrorRateChartWrapper } from './_components/error-rate-chart-wrapper';
import { ResourcesTableWrapper } from './_components/resources-table-wrapper';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { ActivityTimeframe } from '@/types/timeframes';

export default async function ObservabilityPage({
  params,
}: PageProps<'/server/[id]'>) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return notFound();
  }

  // Use a default creation date (e.g., when the origin was created or when observability started)
  const creationDate = new Date('2024-01-01');

  return (
    <Body className="pt-0">
      <HydrateClient>
        <TimeRangeProvider
          creationDate={creationDate}
          initialTimeframe={ActivityTimeframe.OneDay}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Observability</h2>
            <RangeSelector />
          </div>
          <div className="flex gap-6 mb-6">
            <StatusChartWrapper originUrl={origin.origin} />
            <ErrorRateChartWrapper originUrl={origin.origin} />
          </div>
          <ResourcesTableWrapper originUrl={origin.origin} />
        </TimeRangeProvider>
      </HydrateClient>
    </Body>
  );
}
