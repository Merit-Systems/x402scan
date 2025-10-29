'use client';

import {
  FacilitatorChartContent,
  LoadingFacilitatorChartContent,
} from './chart';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { useChain } from '@/app/_contexts/chain/hook';

import { api } from '@/trpc/client';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

interface Props {
  facilitatorId: string;
}

export const FacilitatorChart: React.FC<Props> = ({ facilitatorId }) => {
  const { chain } = useChain();
  const { startDate, endDate } = useTimeRangeContext();

  const [overallStats] = api.public.stats.overall.useSuspenseQuery({
    chain,
    facilitatorIds: [facilitatorId],
    startDate,
    endDate,
  });

  const [bucketedStats] = api.public.stats.bucketed.useSuspenseQuery({
    chain,
    numBuckets: 48,
    facilitatorIds: [facilitatorId],
    startDate,
    endDate,
  });

  const chartData: ChartData<{
    total_transactions: number;
  }>[] = bucketedStats.map(stat => ({
    timestamp: stat.bucket_start.toISOString(),
    total_transactions: Number(stat.total_transactions),
  }));

  return (
    <FacilitatorChartContent
      chartData={chartData}
      total_transactions={Number(overallStats.total_transactions)}
    />
  );
};

export const LoadingFacilitatorChart = () => {
  return <LoadingFacilitatorChartContent />;
};
