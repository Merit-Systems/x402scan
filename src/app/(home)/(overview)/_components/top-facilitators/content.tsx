'use client';

import { api } from '@/trpc/client';
import { useChain } from '@/app/_contexts/chain/hook';
import { Section } from '@/app/_components/layout/page-utils';
import { FacilitatorCard } from './_components/card';
import type { ChartData } from '@/components/ui/charts/chart/types';
import type { RouterOutputs } from '@/trpc/client';
import { cn } from '@/lib/utils';

export const TopFacilitatorsContent = () => {
  const { chain } = useChain();

  const [overallStats] = api.public.stats.overall.useSuspenseQuery({
    chain,
  });

  const [facilitatorsData] = api.public.facilitators.list.useSuspenseQuery({
    chain,
    pagination: {
      page_size: 3,
    },
  });

  return (
    <Section
      title="Top Facilitators"
      description="Analytics on facilitators processing x402 transfers"
      className="gap-4"
      href="/facilitators"
    >
      <div
        className={cn(
          `grid grid-cols-1 gap-4`,
          facilitatorsData.items.length < 2
            ? 'md:grid-cols-1'
            : 'md:grid-cols-2',
          facilitatorsData.items.length < 3
            ? 'md:grid-cols-2'
            : 'md:grid-cols-3'
        )}
      >
        {facilitatorsData.items.map(stats => (
          <FacilitatorCardWithChart
            key={stats.facilitator_id}
            stats={stats}
            overallStats={overallStats}
          />
        ))}
      </div>
    </Section>
  );
};

interface FacilitatorCardWithChartProps {
  stats: RouterOutputs['public']['facilitators']['list']['items'][number];
  overallStats: NonNullable<RouterOutputs['public']['stats']['overall']>;
}

const FacilitatorCardWithChart: React.FC<FacilitatorCardWithChartProps> = ({
  stats,
  overallStats,
}) => {
  const { chain } = useChain();

  const [bucketedStats] = api.public.stats.bucketed.useSuspenseQuery({
    chain,
    numBuckets: 48,
    facilitatorIds: [stats.facilitator_id],
  });

  const chartData: ChartData<{
    total_transactions: number;
  }>[] = bucketedStats.map(stat => ({
    timestamp: stat.bucket_start.toISOString(),
    total_transactions: Number(stat.total_transactions),
  }));

  return (
    <FacilitatorCard
      facilitator={stats.facilitator}
      stats={stats}
      overallStats={overallStats}
      chartData={chartData}
    />
  );
};
