import { api, HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';
import { StatusChart } from './_components/status-chart';
import { ErrorRateChart } from './_components/error-rate-chart';
import { ResourcesTable } from './_components/resources-table';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { ActivityTimeframe } from '@/types/timeframes';
import { ObservabilityBanner } from './_components/observability-banner';

export default async function ObservabilityPage({
  params,
}: PageProps<'/server/[id]'>) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return notFound();
  }

  return (
    <Body className="pt-0">
      <HydrateClient>
        <ObservabilityBanner />
        <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-xl font-bold">Observability</h2>
              <div className="text-sm text-muted-foreground">
                {origin.origin}
              </div>
            </div>
            <RangeSelector />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <StatusChart originUrl={origin.origin} />
            <ErrorRateChart originUrl={origin.origin} />
          </div>
          <ResourcesTable originUrl={origin.origin} />
        </TimeRangeProvider>
      </HydrateClient>
    </Body>
  );
}
