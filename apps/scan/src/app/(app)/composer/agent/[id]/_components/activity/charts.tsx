"use client";

import { BarChart, LoadingBarChart } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatChartTimestamp } from "@/lib/utils";

import type { ChartData } from "@/components/ui/chart";
import type { RouterOutputs } from "@/trpc/client";

interface ActivityChartValues {
  unique_users: number;
  total_messages: number;
  total_tool_calls: number;
}

interface ActivityTab {
  amount: string;
  dataKey: keyof ActivityChartValues;
  label: string;
}

interface ActivityChartsProps {
  agentConfiguration: NonNullable<RouterOutputs["public"]["agents"]["get"]>;
  bucketedActivity: RouterOutputs["public"]["agents"]["activity"]["agent"]["bucketed"];
}

function ActivityCharts({
  agentConfiguration,
  bucketedActivity,
}: ActivityChartsProps) {
  const chartData: ChartData<ActivityChartValues>[] = bucketedActivity.map(
    (item) => ({
      timestamp: item.bucket_start.toISOString(),
      unique_users: item.unique_users,
      total_messages: item.total_messages,
      total_tool_calls: item.total_tool_calls,
    })
  );
  const tabs: ActivityTab[] = [
    {
      amount: agentConfiguration.userCount.toString(),
      dataKey: "unique_users",
      label: "Users",
    },
    {
      amount: agentConfiguration.messageCount.toString(),
      dataKey: "total_messages",
      label: "Messages",
    },
    {
      amount: agentConfiguration.toolCallCount.toString(),
      dataKey: "total_tool_calls",
      label: "Tool Calls",
    },
  ];

  return (
    <Tabs defaultValue="unique_users" className="h-full">
      <TabsList variant="line" className="mx-4 mt-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.dataKey} value={tab.dataKey}>
            {tab.label}
            <span className="text-foreground tabular-nums">{tab.amount}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.dataKey} value={tab.dataKey}>
          <BarChart
            data={chartData}
            bars={[
              {
                dataKey: tab.dataKey,
                color: "var(--color-primary)",
              },
            ]}
            formatTooltipLabel={formatChartTimestamp}
            height={350}
            tooltipRows={[
              {
                dataKey: tab.dataKey,
                label: tab.label,
                formatValue: (value) => value.toLocaleString(),
              },
            ]}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function LoadingActivityCharts() {
  return (
    <Tabs defaultValue="unique_users" className="h-full">
      <TabsList variant="line" className="mx-4 mt-4">
        <TabsTrigger value="unique_users" disabled>
          Users
        </TabsTrigger>
        <TabsTrigger value="total_messages" disabled>
          Messages
        </TabsTrigger>
        <TabsTrigger value="total_tool_calls" disabled>
          Tool Calls
        </TabsTrigger>
      </TabsList>
      <TabsContent value="unique_users">
        <LoadingBarChart height={350} />
      </TabsContent>
    </Tabs>
  );
}

export { ActivityCharts, LoadingActivityCharts };
