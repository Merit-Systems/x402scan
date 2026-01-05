'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BaseBarChart,
  LoadingBarChart,
} from '@/components/ui/charts/chart/bar';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { api } from '@/trpc/client';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

type ToolCallData = {
  total_tool_calls: number;
};

type ToolCallsChartProps = {
  resourceId: string;
  resourceUrl: string;
};

export const ToolCallsChart = ({
  resourceId,
  resourceUrl,
}: ToolCallsChartProps) => {
  const { timeframe } = useTimeRangeContext();

  const { data: toolCallsData, isLoading: toolCallsLoading } =
    api.admin.spending.toolCallsOverTime.useQuery({
      resourceId,
      timeframe,
      numBuckets: 48,
    });

  const isLessThan7Days = useMemo(() => {
    return Number(timeframe) < 7;
  }, [timeframe]);

  const toolCallsChartData = useMemo<ChartData<ToolCallData>[]>(() => {
    const dateFormat = isLessThan7Days ? 'MMM d HH:mm' : 'MMM d';
    return (
      toolCallsData?.map(item => ({
        timestamp: format(new Date(item.bucket_start), dateFormat),
        total_tool_calls: item.total_tool_calls,
      })) ?? []
    );
  }, [toolCallsData, isLessThan7Days]);

  const totalToolCalls = useMemo(
    () =>
      toolCallsData?.reduce((sum, item) => sum + item.total_tool_calls, 0) ?? 0,
    [toolCallsData]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Calls Over Time</CardTitle>
        <CardDescription>
          {totalToolCalls.toLocaleString()} total calls for {resourceUrl}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {toolCallsLoading ? (
          <LoadingBarChart height={300} />
        ) : (
          <BaseBarChart
            data={toolCallsChartData}
            bars={[
              {
                dataKey: 'total_tool_calls',
                color: 'hsl(200, 71.90%, 34.90%)',
              },
            ]}
            height={300}
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
                key: 'total_tool_calls',
                label: 'Tool Calls',
                getValue: value => value.toLocaleString(),
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
