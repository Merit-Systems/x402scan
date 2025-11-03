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

type ResourceCreationData = {
  total_resources: number;
};

interface ResourceCreationsChartProps {
  selectedTagIds: string[];
}

export const ResourceCreationsChart = ({
  selectedTagIds,
}: ResourceCreationsChartProps) => {
  const { startDate, endDate } = useTimeRangeContext();

  const { data: creationsData, isLoading: creationsLoading } =
    api.admin.resources.stats.creations.useQuery({
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      startDate,
      endDate,
      numBuckets: 48,
    });

  // Calculate if range is less than 7 days
  const isLessThan7Days = useMemo(() => {
    const diffInMs = endDate.getTime() - startDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays < 7;
  }, [startDate, endDate]);

  // Transform creations data for chart
  const creationsChartData = useMemo<ChartData<ResourceCreationData>[]>(() => {
    const dateFormat = isLessThan7Days ? 'MMM d HH:mm' : 'MMM d';
    return (
      creationsData?.map(item => ({
        timestamp: format(new Date(item.bucket_start), dateFormat),
        total_resources: item.total_resources,
      })) ?? []
    );
  }, [creationsData, isLessThan7Days]);

  // Calculate totals
  const totalCreations = useMemo(
    () =>
      creationsData?.reduce((sum, item) => sum + item.total_resources, 0) ?? 0,
    [creationsData]
  );

  return (
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
  );
};
