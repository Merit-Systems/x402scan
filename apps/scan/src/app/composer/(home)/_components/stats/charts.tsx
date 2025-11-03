'use client';

import { api } from '@/trpc/client';

import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import type { ChartData } from '@/components/ui/charts/chart/types';

export const OverallCharts = () => {
  const { startDate, endDate } = useTimeRangeContext();

  const [overallStats] = api.public.agents.activity.overall.useSuspenseQuery({
    startDate,
    endDate,
  });
  const [bucketedStats] = api.public.agents.activity.bucketed.useSuspenseQuery({
    numBuckets: 32,
    startDate,
    endDate,
  });

  const chartData: ChartData<{
    requests: number;
    agents: number;
    toolCalls: number;
    users: number;
  }>[] = bucketedStats.map(stat => ({
    requests: stat.total_messages,
    agents: stat.active_agents,
    toolCalls: stat.total_tool_calls,
    users: stat.unique_users,
    timestamp: stat.bucket_start.toISOString(),
  }));

  return (
    <>
      <OverallStatsCard
        title="Requests"
        value={overallStats.message_count.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: 'bar',
          bars: [{ dataKey: 'requests', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'requests',
            label: 'Requests',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Agents"
        value={overallStats.agent_count.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        items={{
          type: 'bar',
          bars: [{ dataKey: 'agents', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'agents',
            label: 'Agents',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Tool Calls"
        value={overallStats.tool_call_count.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: 'bar',
          bars: [{ dataKey: 'toolCalls', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'toolCalls',
            label: 'Tool Calls',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Users"
        value={overallStats.user_count.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        items={{
          type: 'bar',
          bars: [{ dataKey: 'users', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'users',
            label: 'Users',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
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
      <LoadingOverallStatsCard type="bar" title="Requests" />
      <LoadingOverallStatsCard type="area" title="Agents" />
      <LoadingOverallStatsCard type="bar" title="Tool Calls" />
      <LoadingOverallStatsCard type="bar" title="Users" />
    </>
  );
};
