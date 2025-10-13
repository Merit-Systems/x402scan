'use client';

import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import {
  BaseAreaChart,
  LoadingAreaChart,
} from '@/components/ui/charts/chart/area';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { api } from '@/trpc/client';

interface Props {
  addresses: string[];
}

export const KnownSellerChart = ({ addresses }: Props) => {
  const { startDate, endDate } = useTimeRangeContext();

  const { data: bucketedStats, isLoading } =
    api.stats.getBucketedStatistics.useQuery({
      addresses,
      startDate,
      endDate,
      numBuckets: 48,
    });

  const [bazaarOverallStats] =
    api.stats.bazaar.overallStatistics.useSuspenseQuery({
      startDate,
      endDate,
    });

  if (isLoading) {
    return <LoadingKnownSellerChart />;
  }

  if (!bucketedStats) {
    return null;
  }

  const chartData: ChartData<{
    value: number;
  }>[] = bucketedStats.map(stat => ({
    timestamp: stat.bucket_start.toISOString(),
    value: Number(stat.total_transactions),
  }));

  return (
    <BaseAreaChart
      data={chartData}
      areas={[
        {
          dataKey: 'value',
          color: 'var(--color-primary)',
        },
      ]}
      height={32}
      dataMax={Number(bazaarOverallStats.total_transactions) / 48}
    />
  );
};

export const LoadingKnownSellerChart = () => {
  return <LoadingAreaChart height={32} />;
};
