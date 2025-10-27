'use client';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { LoadingMultiCharts, MultiCharts } from '@/components/ui/charts/multi';
import type { RouterOutputs } from '@/trpc/client';

interface Props {
  agentConfiguration: RouterOutputs['public']['agents']['get'];
  bucketedActivity: RouterOutputs['public']['agents']['activity']['agent']['bucketed'];
}
export const ActivityCharts: React.FC<Props> = ({
  agentConfiguration,
  bucketedActivity,
}) => {
  const chartData: ChartData<{
    unique_users: number;
    total_messages: number;
    total_tool_calls: number;
  }>[] = bucketedActivity.map(item => ({
    timestamp: item.bucket_start.toISOString(),
    unique_users: item.unique_users,
    total_messages: item.total_messages,
    total_tool_calls: item.total_tool_calls,
  }));

  return (
    <MultiCharts
      chartData={chartData}
      tabs={[
        {
          trigger: {
            label: 'Users',
            value: 'unique_users',
            amount: agentConfiguration.userCount.toString(),
          },
          items: {
            type: 'bar',
            bars: [
              {
                dataKey: 'unique_users',
                color: 'var(--primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'unique_users',
              label: 'Users',
              getValue: value => value.toString(),
            },
          ],
        },
        {
          trigger: {
            label: 'Messages',
            value: 'total_messages',
            amount: agentConfiguration.messageCount.toString(),
          },
          items: {
            type: 'bar',
            bars: [
              {
                dataKey: 'total_messages',
                color: 'var(--primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'total_messages',
              label: 'Messages',
              getValue: value => value.toString(),
            },
          ],
        },
        {
          trigger: {
            label: 'Tool Calls',
            value: 'total_tool_calls',
            amount: agentConfiguration.toolCallCount.toString(),
          },
          items: {
            type: 'bar',
            bars: [
              {
                dataKey: 'total_tool_calls',
                color: 'var(--primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'total_tool_calls',
              label: 'Tool Calls',
              getValue: value => value.toString(),
            },
          ],
        },
      ]}
    />
  );
};

export const LoadingActivityCharts = () => {
  return (
    <LoadingMultiCharts
      tabs={[
        {
          type: 'bar',
          label: 'Users',
        },
        {
          type: 'bar',
          label: 'Messages',
        },
        {
          type: 'bar',
          label: 'Tool Calls',
        },
      ]}
    />
  );
};
