"use client";

import { api } from "@/trpc/client";

import { LoadingOverallStatsCard, OverallStatsCard } from "./card";

import { convertTokenAmount, formatTokenAmount } from "@/lib/token";

import type { ChartData, ChartItems } from "@/components/ui/charts/chart/types";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

// Chart row types require an implicit string index signature.
// eslint-disable-next-line typescript/consistent-type-definitions
type StatRow = {
  transactions: number;
  totalAmount: number;
  buyers: number;
  sellers: number;
};

export const OverallCharts = ({
  chain,
  timeframe,
}: {
  chain?: Chain;
  timeframe: ActivityTimeframe;
}) => {
  const [overallStats] = api.public.stats.overall.useSuspenseQuery({
    chain,
    timeframe,
  });

  const [bucketedStats] = api.public.stats.bucketed.useSuspenseQuery({
    numBuckets: 48,
    timeframe,
    chain,
  });

  const chartData: ChartData<StatRow>[] = bucketedStats.map((stat) => {
    const txValue = stat.total_transactions;
    const amountValue = parseFloat(
      convertTokenAmount(BigInt(stat.total_amount)).toString()
    );
    const buyersValue = stat.unique_buyers;
    const sellersValue = stat.unique_sellers;

    return {
      transactions: txValue,
      totalAmount: amountValue,
      buyers: buyersValue,
      sellers: sellersValue,
      timestamp: stat.bucket_start.toISOString(),
    };
  });

  const buildItems = (dataKey: keyof StatRow): ChartItems<StatRow> => ({
    type: "bar",
    bars: [{ dataKey, color: "var(--color-primary)" }],
  });
  const txItems = buildItems("transactions");
  const volumeItems = buildItems("totalAmount");
  const buyersItems = buildItems("buyers");
  const sellersItems = buildItems("sellers");

  return (
    <>
      <OverallStatsCard
        title="Transactions"
        value={overallStats.total_transactions.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={txItems}
        data={chartData}
        tooltipRows={[
          {
            key: "transactions",
            label: "Transactions",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Volume"
        value={formatTokenAmount(BigInt(overallStats.total_amount))}
        items={volumeItems}
        data={chartData}
        tooltipRows={[
          {
            key: "totalAmount",
            label: "Volume",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: "currency",
                currency: "USD",
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Buyers"
        value={overallStats.unique_buyers.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={buyersItems}
        data={chartData}
        tooltipRows={[
          {
            key: "buyers",
            label: "Buyers",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Sellers"
        value={overallStats.unique_sellers.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        items={sellersItems}
        data={chartData}
        tooltipRows={[
          {
            key: "sellers",
            label: "Sellers",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
    </>
  );
};

export const LoadingOverallCharts = () => {
  return (
    <>
      <LoadingOverallStatsCard type="bar" title="Transactions" />
      <LoadingOverallStatsCard type="bar" title="Volume" />
      <LoadingOverallStatsCard type="bar" title="Buyers" />
      <LoadingOverallStatsCard type="bar" title="Sellers" />
    </>
  );
};
