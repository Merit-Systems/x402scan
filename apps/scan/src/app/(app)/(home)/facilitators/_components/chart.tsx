"use client";

import {
  createUsageBarChartModel,
  LoadingUsageBarChart,
  UsageBarChart,
} from "@/components/usage-bar-chart";
import type { UsageChartValues } from "@/components/usage-bar-chart";
import type { ChartData } from "@/components/ui/chart";
import { facilitators } from "@/lib/facilitators";

import { api } from "@/trpc/client";

import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

export const FacilitatorsChart = ({
  chain,
  timeframe,
}: {
  chain?: Chain;
  timeframe: ActivityTimeframe;
}) => {
  const [bucketedFacilitatorData] =
    api.public.facilitators.bucketedStatistics.useSuspenseQuery({
      numBuckets: 48,
      timeframe,
      chain,
    });
  const chartData: ChartData<UsageChartValues>[] = bucketedFacilitatorData.map(
    (item) => ({
      timestamp: item.bucket_start.toISOString(),
      ...Object.fromEntries(
        Object.entries(item.facilitators).map<[string, number]>(
          ([facilitatorName, facilitator]) => [
            `${facilitatorName}-transactions`,
            facilitator.total_transactions,
          ]
        )
      ),
    })
  );

  const totals = bucketedFacilitatorData[0]?.totals;

  const facilitatorTotals = facilitators.map((facilitator) => ({
    facilitator,
    totalTransactions: totals?.[facilitator.id]?.totalTransactions ?? 0,
  }));

  const facilitatorsByTransactions = [...facilitatorTotals].sort(
    (a, b) => b.totalTransactions - a.totalTransactions
  );

  const chart = createUsageBarChartModel({
    chartData,
    items: facilitatorsByTransactions.map((item) => item.facilitator),
    formatValue: (value, total) =>
      `${(total > 0 ? (value / total) * 100 : 0).toFixed(1)}%`,
    getKey: (facilitator) => `${facilitator.id}-transactions`,
  });

  return <UsageBarChart {...chart} />;
};

export const LoadingFacilitatorsChart = () => {
  return <LoadingUsageBarChart />;
};
