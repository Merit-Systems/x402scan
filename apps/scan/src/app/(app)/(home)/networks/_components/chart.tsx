"use client";

import {
  createUsageBarChartModel,
  LoadingUsageBarChart,
  UsageBarChart,
} from "@/components/usage-bar-chart";

import { networks } from "@/lib/charts";

import type { ChartData } from "@/components/ui/chart";
import type { UsageChartValues } from "@/components/usage-bar-chart";

import type { getBucketedNetworksStatistics } from "@/services/transfers/networks/bucketed";

export const NetworksChart = ({
  bucketedNetworkData,
}: {
  bucketedNetworkData: Awaited<
    ReturnType<typeof getBucketedNetworksStatistics>
  >;
}) => {
  const chartData: ChartData<UsageChartValues>[] = bucketedNetworkData.map(
    (item) => {
      // Buckets only include networks with data, so start every known
      // network at zero and overwrite with the returned stats.
      const metrics = {
        "base-transactions": 0,
        "solana-transactions": 0,
        "polygon-transactions": 0,
        "optimism-transactions": 0,
      } satisfies UsageChartValues;
      for (const network of networks) {
        const stats = item.networks[network.chain];
        if (stats) {
          metrics[`${network.chain}-transactions`] = stats.total_transactions;
        }
      }
      return { timestamp: item.bucket_start.toISOString(), ...metrics };
    }
  );

  const networksByTransactions = networks
    .map((network) => ({
      network,
      totalTransactions: bucketedNetworkData.reduce(
        (total, bucket) =>
          total + (bucket.networks[network.chain]?.total_transactions ?? 0),
        0
      ),
    }))
    .toSorted((a, b) => b.totalTransactions - a.totalTransactions)
    .map((item) => item.network);

  const chart = createUsageBarChartModel({
    chartData,
    items: networksByTransactions,
    formatValue: (value, total) =>
      `${(total > 0 ? (value / total) * 100 : 0).toFixed(1)}%`,
    getKey: (network) => `${network.chain}-transactions`,
  });

  return <UsageBarChart {...chart} />;
};

export const LoadingNetworksChart = () => {
  return <LoadingUsageBarChart />;
};
