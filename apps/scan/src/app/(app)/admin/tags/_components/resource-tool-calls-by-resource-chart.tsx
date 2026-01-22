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
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';

type ResourceKey = `${string}-tool_calls`;

// Create a seeded random number generator for consistent colors
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

// Generate a perturbed color based on base hue
const generatePerturbedColor = (baseHue: number, seed: string) => {
  const rand = seededRandom(seed);
  const rand2 = seededRandom(seed + 'sat');
  const rand3 = seededRandom(seed + 'light');

  // Perturb hue by ±20 degrees
  const hue = (baseHue + (rand * 40 - 20) + 360) % 360;
  // Perturb saturation by ±15%
  const saturation = Math.max(55, Math.min(85, 70 + (rand2 * 30 - 15)));
  // Perturb lightness by ±10%
  const lightness = Math.max(40, Math.min(60, 50 + (rand3 * 20 - 10)));

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

interface ResourceToolCallsByResourceChartProps {
  selectedTagIds: string[];
}

export const ResourceToolCallsByResourceChart = ({
  selectedTagIds,
}: ResourceToolCallsByResourceChartProps) => {
  const { timeframe } = useTimeRangeContext();

  // Fetch all resources for labels
  const { data: allResources } = api.public.resources.list.all.useQuery();

  // Query for tool calls by resources with tag filter
  const { data: toolCallsByResourcesData, isLoading } =
    api.admin.resources.stats.toolCallsByResources.useQuery({
      timeframe,
      numBuckets: 48,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    });

  // Calculate if range is less than 7 days
  const isLessThan7Days = useMemo(() => {
    return Number(timeframe) < 7;
  }, [timeframe]);

  // Transform data for chart
  const chartData = useMemo<ChartData<Record<ResourceKey, number>>[]>(() => {
    if (!toolCallsByResourcesData) return [];

    const dateFormat = isLessThan7Days ? 'MMM d HH:mm' : 'MMM d';

    return toolCallsByResourcesData.map(item => {
      const numericData: Record<string, number> = {};

      Object.entries(item.resources).forEach(([resourceId, resource]) => {
        numericData[`${resourceId}-tool_calls`] = resource.total_tool_calls;
      });

      return {
        timestamp: format(new Date(item.bucket_start), dateFormat),
        ...numericData,
      } as ChartData<Record<ResourceKey, number>>;
    });
  }, [toolCallsByResourcesData, isLessThan7Days]);

  // Get unique resource IDs from the data
  const resourceIdsInData = useMemo(() => {
    if (!toolCallsByResourcesData) return new Set<string>();

    const ids = new Set<string>();
    toolCallsByResourcesData.forEach(item => {
      Object.keys(item.resources).forEach(resourceId => ids.add(resourceId));
    });
    return ids;
  }, [toolCallsByResourcesData]);

  // Create bars from resources
  const bars = useMemo(() => {
    if (!allResources || resourceIdsInData.size === 0) return [];

    // Filter resources that have data
    const resourcesWithData = allResources.filter(resource =>
      resourceIdsInData.has(resource.id)
    );

    // Map resources to bars with perturbed colors
    return resourcesWithData.map((resource, index) => {
      const baseHue = (index * 360) / resourcesWithData.length;
      const dataKey: ResourceKey = `${resource.id}-tool_calls`;
      return {
        dataKey,
        color: generatePerturbedColor(baseHue, resource.id),
      };
    });
  }, [allResources, resourceIdsInData]);

  // Create tooltip rows from resources
  const tooltipRows = useMemo(() => {
    if (!allResources || resourceIdsInData.size === 0) return [];

    // Filter resources that have data
    const resourcesWithData = allResources.filter(resource =>
      resourceIdsInData.has(resource.id)
    );

    // Map resources to tooltip rows with matching perturbed colors
    return resourcesWithData.map((resource, index) => {
      const baseHue = (index * 360) / resourcesWithData.length;
      const key: ResourceKey = `${resource.id}-tool_calls`;
      return {
        key,
        label: resource.resource,
        getValue: (value: number) => value.toLocaleString(),
        dotColor: generatePerturbedColor(baseHue, resource.id),
      };
    });
  }, [allResources, resourceIdsInData]);

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage by Tool</CardTitle>
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
        <CardTitle>Usage by Tool</CardTitle>
        <CardDescription>
          {bars.length > 0
            ? 'Tool calls breakdown by individual tools in selected tags'
            : 'No tool calls found for selected tags'}
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
              No tool calls found for the selected tags in this time range
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
