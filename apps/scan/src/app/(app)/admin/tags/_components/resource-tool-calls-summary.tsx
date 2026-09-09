"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, LoadingBarChart } from "@/components/ui/chart";
import type { ChartData } from "@/components/ui/chart";
import { api } from "@/trpc/client";
import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { ActivityTimeframe } from "@/types/timeframes";

interface ResourceToolCallData {
  total_tool_calls: number;
}

interface ResourceToolCallsSummaryProps {
  selectedTagIds: string[];
}

export const ResourceToolCallsSummary = ({
  selectedTagIds,
}: ResourceToolCallsSummaryProps) => {
  const { timeframe } = useTimeRangeContext();

  const { data: toolCallsData, isLoading: toolCallsLoading } =
    api.admin.resources.stats.toolCalls.useQuery({
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      timeframe,
      numBuckets: 48,
    });

  // Calculate if range is less than 7 days
  const isLessThan7Days = useMemo(() => {
    return timeframe < ActivityTimeframe.SevenDays;
  }, [timeframe]);

  // Transform tool calls data for chart
  const toolCallsChartData = useMemo<ChartData<ResourceToolCallData>[]>(() => {
    const dateFormat = isLessThan7Days ? "MMM d HH:mm" : "MMM d";
    return (
      toolCallsData?.map((item) => ({
        timestamp: format(new Date(item.bucket_start), dateFormat),
        total_tool_calls: item.total_tool_calls,
      })) ?? []
    );
  }, [toolCallsData, isLessThan7Days]);

  // Calculate totals
  const totalToolCalls = useMemo(
    () =>
      toolCallsData?.reduce((sum, item) => sum + item.total_tool_calls, 0) ?? 0,
    [toolCallsData]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Usage Over Time</CardTitle>
        <CardDescription>
          {selectedTagIds.length > 0
            ? `Showing ${totalToolCalls.toLocaleString()} tool calls for selected tags`
            : `Total: ${totalToolCalls.toLocaleString()} tool calls`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {toolCallsLoading ? (
          <LoadingBarChart height={450} />
        ) : (
          <BarChart
            data={toolCallsChartData}
            bars={[
              {
                dataKey: "total_tool_calls",
                color: "hsl(200, 71.90%, 34.90%)",
              },
            ]}
            height={450}
            stacked={false}
            solid={true}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            xAxis={{
              show: true,
              angle: -45,
              height: isLessThan7Days ? 80 : 60,
            }}
            tooltipRows={[
              {
                dataKey: "total_tool_calls",
                label: "Tool Calls",
                formatValue: (value) => value.toLocaleString(),
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
