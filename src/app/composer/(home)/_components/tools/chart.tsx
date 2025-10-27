'use client';

import {
  BaseAreaChart,
  LoadingAreaChart,
} from '@/components/ui/charts/chart/area';
import { api } from '@/trpc/client';

import type { ChartData } from '@/components/ui/charts/chart/types';

interface Props {
  addresses: string[];
}

export const KnownSellerChart = ({ addresses }: Props) => {
  const { data: bucketedStats, isLoading } = api.public.stats.bucketed.useQuery(
    {
      recipients: {
        include: addresses,
      },
      numBuckets: 48,
    }
  );

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
    />
  );
};

export const LoadingKnownSellerChart = () => {
  return <LoadingAreaChart height={32} />;
};
