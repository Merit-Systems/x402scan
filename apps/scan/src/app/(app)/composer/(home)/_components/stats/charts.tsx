"use client";

import { api } from "@/trpc/client";

import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";

import { LoadingStatsCard, StatsCard } from "@/components/ui/stats-card";
import { formatChartTimestamp } from "@/lib/utils";

import type { ChartData } from "@/components/ui/chart";

export const OverallCharts = () => {
  const { timeframe } = useTimeRangeContext();

  const [overallStats] = api.public.agents.activity.overall.useSuspenseQuery({
    timeframe,
  });
  const [bucketedStats] = api.public.agents.activity.bucketed.useSuspenseQuery({
    numBuckets: 32,
    timeframe,
  });

  const chartData: ChartData<{
    requests: number;
    agents: number;
    toolCalls: number;
    users: number;
  }>[] = bucketedStats.map((stat) => ({
    requests: stat.total_messages,
    agents: stat.active_agents,
    toolCalls: stat.total_tool_calls,
    users: stat.unique_users,
    timestamp: stat.bucket_start.toISOString(),
  }));

  return (
    <>
      <StatsCard
        title="Requests"
        value={overallStats.message_count.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "requests", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "requests",
            label: "Requests",
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
        title="Users"
        value={overallStats.user_count.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "users", color: "var(--color-primary)" }],
        }}
        data={chartData}
        formatTooltipLabel={formatChartTimestamp}
        tooltipRows={[
          {
            dataKey: "users",
            label: "Users",
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
      <LoadingStatsCard type="bar" title="Requests" />
      <LoadingStatsCard type="bar" title="Users" />
    </>
  );
};
