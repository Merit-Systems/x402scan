"use client";

import {
  createUsageBarChartModel,
  LoadingUsageBarChart,
  UsageBarChart,
} from "@/components/usage-bar-chart";

import { facilitators } from "@/lib/facilitators";

import type { ChartData } from "@/components/ui/chart";
import type { UsageChartValues } from "@/components/usage-bar-chart";

import type { getBucketedFacilitatorsStatistics } from "@/services/transfers/facilitators/bucketed";

interface FacilitatorsChartProps {
  bucketedFacilitatorData: Awaited<
    ReturnType<typeof getBucketedFacilitatorsStatistics>
  >;
}

export const FacilitatorsChart = ({
  bucketedFacilitatorData,
}: FacilitatorsChartProps) => {
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

  const facilitatorsByTransactions = [...facilitatorTotals].toSorted(
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
