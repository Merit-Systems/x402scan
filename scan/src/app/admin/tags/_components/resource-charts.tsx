'use client';

import { useState, useMemo } from 'react';
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
import { TagFilter } from './tag-filter';

type ResourceCreationData = {
  total_resources: number;
};

type ResourceToolCallData = {
  total_tool_calls: number;
};

export const ResourceCharts = () => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Query for resource creations over time
  const { data: creationsData, isLoading: creationsLoading } =
    api.admin.resources.stats.creations.useQuery({
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    });

  // Query for resource tool calls over time
  const { data: toolCallsData, isLoading: toolCallsLoading } =
    api.admin.resources.stats.toolCalls.useQuery({
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    });

  // Transform creations data for chart
  const creationsChartData = useMemo<ChartData<ResourceCreationData>[]>(
    () =>
      creationsData?.map(item => ({
        timestamp: format(new Date(item.bucket_start), 'MMM d'),
        total_resources: item.total_resources,
      })) ?? [],
    [creationsData]
  );

  // Transform tool calls data for chart
  const toolCallsChartData = useMemo<ChartData<ResourceToolCallData>[]>(
    () =>
      toolCallsData?.map(item => ({
        timestamp: format(new Date(item.bucket_start), 'MMM d'),
        total_tool_calls: item.total_tool_calls,
      })) ?? [],
    [toolCallsData]
  );

  // Calculate totals
  const totalCreations = useMemo(
    () =>
      creationsData?.reduce((sum, item) => sum + item.total_resources, 0) ?? 0,
    [creationsData]
  );

  const totalToolCalls = useMemo(
    () =>
      toolCallsData?.reduce((sum, item) => sum + item.total_tool_calls, 0) ?? 0,
    [toolCallsData]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resource Analytics</h2>
        <TagFilter
          selectedTagIds={selectedTagIds}
          onSelectedTagIdsChange={setSelectedTagIds}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Resources Added Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Resources Added Over Time</CardTitle>
            <CardDescription>
              {selectedTagIds.length > 0
                ? `Showing ${totalCreations.toLocaleString()} resources with selected tags`
                : `Total: ${totalCreations.toLocaleString()} resources`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creationsLoading ? (
              <LoadingBarChart height={450} />
            ) : (
              <BaseBarChart
                data={creationsChartData}
                bars={[
                  {
                    dataKey: 'total_resources',
                    color: 'hsl(210, 100%, 56%)',
                  },
                ]}
                height={450}
                stacked={false}
                solid={true}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                xAxis={{ show: true, angle: -45, height: 60 }}
                tooltipRows={[
                  {
                    key: 'total_resources',
                    label: 'Resources',
                    getValue: value => value.toLocaleString(),
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Resource Tool Calls Over Time Chart */}
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
              <BaseBarChart
                data={toolCallsChartData}
                bars={[
                  {
                    dataKey: 'total_tool_calls',
                    color: 'hsl(200, 71.90%, 34.90%)',
                  },
                ]}
                height={450}
                stacked={false}
                solid={true}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                xAxis={{ show: true, angle: -45, height: 60 }}
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
      </div>
    </div>
  );
};
