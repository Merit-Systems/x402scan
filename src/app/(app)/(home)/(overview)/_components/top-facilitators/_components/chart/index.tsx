import { api } from '@/trpc/server';

import {
  FacilitatorChartContent,
  LoadingFacilitatorChartContent,
} from './chart';

import type { Facilitator } from '@/lib/facilitators';
import type { ChartData } from '@/components/ui/charts/chart/types';

interface Props {
  facilitator: Facilitator;
  total_transactions: number;
}

export const FacilitatorChart: React.FC<Props> = async ({
  facilitator,
  total_transactions,
}) => {
  const bucketedStats = await api.stats.getBucketedStatistics({
    numBuckets: 48,
    facilitators: facilitator.addresses,
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
      total_transactions={total_transactions}
    />
  );
};

export const LoadingFacilitatorChart = () => {
  return <LoadingFacilitatorChartContent />;
};
