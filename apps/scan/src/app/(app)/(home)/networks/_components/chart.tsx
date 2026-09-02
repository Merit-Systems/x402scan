"use client";

import type { ChartData } from "@/components/ui/charts/chart/types";
import { LoadingMultiCharts, MultiCharts } from "@/components/ui/charts/multi";
import type { Chain } from "@/types/chain";

import { formatTokenAmount } from "@/lib/token";
import { createTab, networks } from "@/lib/charts";
import { api } from "@/trpc/client";
import type { ActivityTimeframe } from "@/types/timeframes";

type NetworkKey = `${Chain}-${"transactions" | "amount"}`;

export const NetworksChart = ({
  chain,
  timeframe,
}: {
  chain?: Chain;
  timeframe: ActivityTimeframe;
}) => {
  const [bucketedNetworkData] =
    api.networks.bucketedStatistics.useSuspenseQuery({
      numBuckets: 48,
      timeframe,
      chain,
    });
  const [overallData] = api.public.stats.overall.useSuspenseQuery({
    timeframe,
    chain,
  });

  const chartData: ChartData<Record<NetworkKey, number>>[] =
    bucketedNetworkData.map((item) => {
      // Buckets only include networks with data, so start every known
      // network at zero and overwrite with the returned stats.
      const metrics = {
        "base-transactions": 0,
        "base-amount": 0,
        "solana-transactions": 0,
        "solana-amount": 0,
        "polygon-transactions": 0,
        "polygon-amount": 0,
        "optimism-transactions": 0,
        "optimism-amount": 0,
      } satisfies Record<NetworkKey, number>;
      for (const network of networks) {
        const stats = item.networks[network.chain];
        if (stats) {
          metrics[`${network.chain}-transactions`] = stats.total_transactions;
          metrics[`${network.chain}-amount`] = stats.total_amount;
        }
      }
      return { timestamp: item.bucket_start.toISOString(), ...metrics };
    });

  const getValueHandler = (
    data: number,
    id: string,
    allData: Record<NetworkKey, number>
  ) => {
    const total = networks.reduce(
      (sum, network) =>
        sum + (allData[`${network.chain}-${id}` as NetworkKey] || 0),
      0
    );
    const percentage = total > 0 ? (data / total) * 100 : 0;
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="flex flex-col gap-4">
      <MultiCharts
        chartData={chartData}
        tabs={[
          createTab<Record<NetworkKey, number>, (typeof networks)[number]>({
            label: "Transactions",
            stackOffset: "expand",
            amount: overallData.total_transactions.toLocaleString(),
            items: networks,
            getKey: (n) => n.chain,
            getValue: (
              data: number,
              dataType: string,
              allData: Record<NetworkKey, number>
            ) => getValueHandler(data, dataType, allData),
          }),
          createTab<Record<NetworkKey, number>, (typeof networks)[number]>({
            label: "Amount",
            stackOffset: "expand",
            amount: formatTokenAmount(BigInt(overallData.total_amount)),
            items: networks,
            getKey: (n) => n.chain,
            getValue: (
              data: number,
              dataType: string,
              allData: Record<NetworkKey, number>
            ) => getValueHandler(data, dataType, allData),
          }),
        ]}
      />
    </div>
  );
};

export const LoadingNetworksChart = () => {
  return (
    <LoadingMultiCharts
      tabs={[
        {
          type: "bar",
          label: "Transactions",
        },
        {
          type: "bar",
          label: "Amount",
        },
      ]}
    />
  );
};
