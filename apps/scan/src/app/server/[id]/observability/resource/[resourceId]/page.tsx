import { api, HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';
import { StatusChart } from '../../_components/status-chart';
import { ErrorRateChart } from '../../_components/error-rate-chart';
import { LatencyChart } from '../../_components/latency-chart';
import { ResourceHeader } from '../../_components/resource-header';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { ActivityTimeframe } from '@/types/timeframes';

function decodeResourceId(resourceId: string): string {
  try {
    // Decode URL-safe base64
    const base64 = resourceId.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid resource ID');
  }
}

export default async function ResourcePage({
  params,
}: PageProps<'/server/[id]/observability/resource/[resourceId]'>) {
  const { id, resourceId } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    return notFound();
  }

  // Decode the resource ID to get the URL
  let resourceUrl: string;
  try {
    resourceUrl = decodeResourceId(resourceId);
  } catch {
    return notFound();
  }

  // NOTE(shafu): use a default creation date
  const creationDate = new Date('2024-01-01');

  return (
    <Body className="pt-0">
      <HydrateClient>
        <TimeRangeProvider
          creationDate={creationDate}
          initialTimeframe={ActivityTimeframe.OneDay}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-xl font-bold">Observability</h2>
              <div className="text-sm text-muted-foreground">
                {origin.origin}
              </div>
            </div>
            <RangeSelector />
          </div>

          <ResourceHeader resourceUrl={resourceUrl} />
          <div className="flex gap-6 mb-6">
            <StatusChart originUrl={origin.origin} resourceUrl={resourceUrl} />
            <ErrorRateChart
              originUrl={origin.origin}
              resourceUrl={resourceUrl}
            />
            <LatencyChart originUrl={origin.origin} resourceUrl={resourceUrl} />
          </div>
        </TimeRangeProvider>
      </HydrateClient>
    </Body>
  );
}
