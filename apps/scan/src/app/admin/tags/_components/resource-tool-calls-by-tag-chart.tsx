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
import type { ChartData } from '@/components/ui/charts/chart/types';
import {
  BaseBarChart,
  LoadingBarChart,
} from '@/components/ui/charts/chart/bar';
import { api } from '@/trpc/client';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

type TagKey = `${string}-tool_calls`;

function createTagKey(tagId: string): TagKey {
  return `${tagId}-tool_calls`;
}

export const ResourceToolCallsByTagChart = () => {
  const { timeframe } = useTimeRangeContext();

  // Fetch all tags for labels
  const { data: allTags } = api.public.resources.tags.list.useQuery();

  // Query for tool calls by tags
  const { data: toolCallsByTagsData, isLoading } =
    api.admin.resources.stats.toolCallsByTags.useQuery({
      timeframe,
      numBuckets: 48,
    });

  // Calculate if range is less than 7 days
  const isLessThan7Days = useMemo(() => {
    return timeframe < 7;
  }, [timeframe]);

  // Transform data for chart
  const chartData = useMemo<ChartData<Record<TagKey, number>>[]>(() => {
    if (!toolCallsByTagsData) return [];

    const dateFormat = isLessThan7Days ? 'MMM d HH:mm' : 'MMM d';

    return toolCallsByTagsData.map(item => {
      const numericData: Record<string, number> = {};

      Object.entries(item.tags).forEach(([tagId, tag]) => {
        numericData[`${tagId}-tool_calls`] = tag.total_tool_calls;
      });

      return {
        timestamp: format(new Date(item.bucket_start), dateFormat),
        ...numericData,
      } as ChartData<Record<TagKey, number>>;
    });
  }, [toolCallsByTagsData, isLessThan7Days]);

  // Create bars from tags
  const bars = useMemo(() => {
    if (!allTags || !toolCallsByTagsData) return [];

    // Get unique tag IDs from the data
    const tagIdsInData = new Set<string>();
    toolCallsByTagsData.forEach(item => {
      Object.keys(item.tags).forEach(tagId => tagIdsInData.add(tagId));
    });

    // Filter and map tags to bars
    return allTags
      .filter(tag => tagIdsInData.has(tag.id))
      .map(tag => ({
        dataKey: createTagKey(tag.id),
        color: tag.color,
      }));
  }, [allTags, toolCallsByTagsData]);

  // Create tooltip rows from tags
  const tooltipRows = useMemo(() => {
    if (!allTags || !toolCallsByTagsData) return [];

    // Get unique tag IDs from the data
    const tagIdsInData = new Set<string>();
    toolCallsByTagsData.forEach(item => {
      Object.keys(item.tags).forEach(tagId => tagIdsInData.add(tagId));
    });

    // Filter and map tags to tooltip rows
    return allTags
      .filter(tag => tagIdsInData.has(tag.id))
      .map(tag => ({
        key: createTagKey(tag.id),
        label: tag.name,
        getValue: (value: number) => value.toLocaleString(),
        dotColor: tag.color,
      }));
  }, [allTags, toolCallsByTagsData]);

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage by Tag</CardTitle>
          <CardDescription>Loading breakdown...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingBarChart height={450} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage by Tag</CardTitle>
        <CardDescription>
          {bars.length > 0
            ? 'Tool calls breakdown by tag category'
            : 'No breakdown available - resources need to be tagged first'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bars.length > 0 ? (
          <BaseBarChart
            data={chartData}
            bars={bars}
            height={450}
            stacked={true}
            xAxis={{
              show: true,
              angle: -45,
              height: isLessThan7Days ? 80 : 60,
            }}
            tooltipRows={tooltipRows}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[450px] text-center text-muted-foreground space-y-2">
            <p className="text-sm">
              Tag resources in the table below to see breakdown by category
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
