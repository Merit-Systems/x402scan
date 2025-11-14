import { HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Body } from '@/app/_components/layout/page-utils';
import { StatusChart } from './_components/status-chart';
import { ErrorRateChart } from './_components/error-rate-chart';
import { LatencyChart } from './_components/latency-chart';
import { MethodsTable } from './_components/methods-table';
import { InvocationsTable } from './_components/invocations-table';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { ActivityTimeframe } from '@/types/timeframes';
import { facilitatorIdMap } from '@/lib/facilitators';
import { ObservabilityBanner } from '@/app/server/[id]/observability/_components/observability-banner';

export default async function FacilitatorObservabilityPage({
  params,
}: PageProps<'/facilitator/[id]/observability'>) {
  const { id } = await params;
  const facilitator = facilitatorIdMap.get(id);

  if (!facilitator) {
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
                {facilitator.name}
              </div>
            </div>
            <RangeSelector />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <StatusChart facilitatorName={id} />
            <ErrorRateChart facilitatorName={id} />
            <LatencyChart facilitatorName={id} />
          </div>

          <div className="mb-6">
            <MethodsTable facilitatorName={id} />
          </div>

          <InvocationsTable facilitatorName={id} />
        </TimeRangeProvider>
      </HydrateClient>
    </Body>
  );
}
