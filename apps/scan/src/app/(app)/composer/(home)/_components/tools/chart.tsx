"use client";

import { AreaChart, LoadingAreaChart } from "@/components/ui/chart";
import { api } from "@/trpc/client";

import type { ChartData } from "@/components/ui/chart";
import { ActivityTimeframe } from "@/types/timeframes";

interface Props {
  addresses: string[];
}

export const KnownSellerChart = ({ addresses }: Props) => {
  const { data: bucketedStats, isLoading } = api.public.stats.bucketed.useQuery(
    {
      recipients: {
        include: addresses,
      },
      timeframe: ActivityTimeframe.ThirtyDays,
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
  }>[] = bucketedStats.map((stat) => ({
    timestamp: stat.bucket_start.toISOString(),
    value: stat.total_transactions,
  }));

  return (
    <AreaChart
      data={chartData}
      areas={[
        {
          dataKey: "value",
          color: "var(--color-primary)",
        },
      ]}
      height={32}
    />
  );
};

export const LoadingKnownSellerChart = () => {
  return <LoadingAreaChart height={32} />;
};
