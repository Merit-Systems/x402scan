'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

import { BaseBarChart, LoadingBarChart } from '../chart/bar';
import { BaseAreaChart, LoadingAreaChart } from '../chart/area';

import type { ChartData, ChartProps } from '../chart/types';
import type { BarChartProps, StackOffset } from '../chart/bar/types';
import type { AreaChartProps } from '../chart/area/types';

import type { TabsTriggerProps } from './tabs';

interface TabProps<T extends Record<string, number>> {
  trigger: TabsTriggerProps;
  items:
    | {
        type: 'bar';
        bars: BarChartProps<T>['bars'];
        solid?: boolean;
        stackOffset?: StackOffset;
      }
    | {
        type: 'area';
        areas: AreaChartProps<T>['areas'];
      };
  tooltipRows?: ChartProps<T>['tooltipRows'];
}

interface Props<T extends Record<string, number>> {
  chartData: ChartData<T>[];
  tabs: TabProps<T>[];
  height?: number | string;
}

export const MultiCharts = <T extends Record<string, number>>({
  tabs,
  chartData,
  height,
}: Props<T>) => {
  return (
    <Tabs defaultValue={tabs[0].trigger.value} className="h-full">
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.trigger.label} {...tab.trigger} />
        ))}
      </TabsList>
      {tabs.map(({ trigger, items, tooltipRows }) => (
        <TabsContent
          key={trigger.label}
          value={trigger.value}
          className="flex-1 h-0"
        >
          {items.type === 'bar' ? (
            <BaseBarChart
              data={chartData}
              bars={items.bars}
              tooltipRows={tooltipRows}
              height={height}
              solid={items.solid}
              stackOffset={items.stackOffset}
            />
          ) : (
            <BaseAreaChart
              data={chartData}
              areas={items.areas}
              tooltipRows={tooltipRows}
              height={height}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

interface LoadingMultiChartsProps {
  tabs: {
    type: 'bar' | 'area';
    label: string;
  }[];
  height?: number | string;
}

export const LoadingMultiCharts: React.FC<LoadingMultiChartsProps> = ({
  tabs,
  height,
}) => {
  return (
    <div className="animate-pulse">
      <Tabs defaultValue={tabs[0].label}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              label={tab.label}
              isLoading={true}
            />
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.label} value={tab.label}>
            {tab.type === 'bar' ? (
              <LoadingBarChart height={height} />
            ) : (
              <LoadingAreaChart height={height} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
