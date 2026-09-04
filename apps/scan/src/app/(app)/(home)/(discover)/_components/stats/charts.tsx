"use client";

import { api } from "@/trpc/client";

import { LoadingStatsCard, StatsCard } from "@/components/ui/stats-card";
import { convertTokenAmount, formatTokenAmount } from "@/lib/token";
import { formatChartTimestamp } from "@/lib/utils";

import type { ChartData } from "@/components/ui/chart";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

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

  const chartData: ChartData<{
    transactions: number;
    totalAmount: number;
    buyers: number;
    sellers: number;
  }>[] = bucketedStats.map((stat) => {
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

  return (
    <>
      <StatsCard
        title="Transactions"
        value={overallStats.total_transactions.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "transactions", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "transactions",
            label: "Transactions",
            formatValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />
      <StatsCard
        title="Volume"
        value={formatTokenAmount(BigInt(overallStats.total_amount))}
        items={{
          type: "bar",
          bars: [{ dataKey: "totalAmount", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "totalAmount",
            label: "Volume",
            formatValue: (data) =>
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
      <StatsCard
        title="Buyers"
        value={overallStats.unique_buyers.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "buyers", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "buyers",
            label: "Buyers",
            formatValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
      <StatsCard
        title="Sellers"
        value={overallStats.unique_sellers.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "sellers", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "sellers",
            label: "Sellers",
            formatValue: (data) =>
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
      <LoadingStatsCard type="bar" title="Transactions" />
      <LoadingStatsCard type="bar" title="Volume" />
      <LoadingStatsCard type="bar" title="Buyers" />
      <LoadingStatsCard type="bar" title="Sellers" />
    </>
  );
};
