"use client";

import { StatsCardGrid } from "@/components/stats-card-grid";
import { LoadingStatsCard, StatsCard } from "@/components/ui/stats-card";
import { convertTokenAmount, formatTokenAmount } from "@/lib/token";
import { formatChartTimestamp, formatNumber } from "@/lib/utils";
import { api } from "@/trpc/client";

import type { ChartData } from "@/components/ui/chart";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

export function FacilitatorStatCards({
  chain,
  facilitatorId,
  timeframe,
}: {
  chain?: Chain;
  facilitatorId: string;
  timeframe: ActivityTimeframe;
}) {
  const input = {
    chain,
    facilitatorIds: [facilitatorId],
    timeframe,
  };
  const [overall] = api.public.stats.overall.useSuspenseQuery(input);
  const [timeSeries] = api.public.stats.bucketed.useSuspenseQuery({
    ...input,
    numBuckets: 48,
  });

  const chartData: ChartData<{
    transactions: number;
    volume: number;
    buyers: number;
  }>[] = timeSeries.map((point) => ({
    transactions: point.total_transactions,
    volume: convertTokenAmount(BigInt(point.total_amount)),
    buyers: point.unique_buyers,
    timestamp: point.bucket_start.toISOString(),
  }));

  return (
    <StatsCardGrid className="md:grid-cols-3">
      <StatsCard
        title="Transactions"
        value={formatNumber(overall.total_transactions)}
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
            formatValue: formatNumber,
          },
        ]}
      />
      <StatsCard
        title="Volume"
        value={formatTokenAmount(BigInt(overall.total_amount))}
        items={{
          type: "bar",
          bars: [{ dataKey: "volume", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "volume",
            label: "Volume",
            formatValue: (value) =>
              value.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              }),
          },
        ]}
      />
      <StatsCard
        title="Buyers"
        value={formatNumber(overall.unique_buyers)}
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
            formatValue: formatNumber,
          },
        ]}
      />
    </StatsCardGrid>
  );
}

export function LoadingFacilitatorStatCards() {
  return (
    <StatsCardGrid className="md:grid-cols-3">
      <LoadingStatsCard type="bar" title="Transactions" />
      <LoadingStatsCard type="bar" title="Volume" />
      <LoadingStatsCard type="bar" title="Buyers" />
    </StatsCardGrid>
  );
}
