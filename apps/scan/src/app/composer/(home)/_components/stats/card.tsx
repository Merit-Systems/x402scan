import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BaseAreaChart,
  LoadingAreaChart,
} from '@/components/ui/charts/chart/area';
import {
  BaseBarChart,
  LoadingBarChart,
} from '@/components/ui/charts/chart/bar';
import type {
  ChartData,
  ChartItems,
  TooltipRowProps,
} from '@/components/ui/charts/chart/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

type Props<T extends Record<string, number>> = {
  title: string;
  value: string;
  items: ChartItems<T>;
  percentageChange?: number;
  data: ChartData<T>[];
  tooltipRows?: Array<TooltipRowProps<T>>;
};

export const OverallStatsCard = <T extends Record<string, number>>({
  title,
  value,
  items,
  percentageChange,
  data,
  tooltipRows,
}: Props<T>) => {
  return (
    <OverallStatsCardContainer
      title={title}
      value={
        <div className="flex items-center gap-2">
          <CardTitle className="text-2xl font-bold">{value}</CardTitle>
          {percentageChange !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-1 rounded-md text-xs font-mono',
                percentageChange > 0
                  ? 'bg-green-600/10 text-green-600'
                  : percentageChange === 0
                    ? 'bg-neutral-600/10 text-neutral-600'
                    : 'bg-red-600/10 text-red-500'
              )}
            >
              <p>
                {percentageChange >= 0 ? '+' : ''}
                {percentageChange.toFixed(2)}%
              </p>

              {percentageChange > 0 ? (
                <TrendingUp className="size-3" />
              ) : percentageChange < 0 ? (
                <TrendingDown className="size-3" />
              ) : null}
            </div>
          )}
        </div>
      }
    >
      {items.type === 'bar' ? (
        <BaseBarChart
          data={data}
          bars={items.bars}
          height={100}
          tooltipRows={tooltipRows}
        />
      ) : (
        <BaseAreaChart
          data={data}
          areas={items.areas}
          height={100}
          tooltipRows={tooltipRows}
        />
      )}
    </OverallStatsCardContainer>
  );
};

export const LoadingOverallStatsCard = ({
  type,
  title,
}: {
  type: 'bar' | 'area';
  title: string;
}) => {
  return (
    <OverallStatsCardContainer
      title={title}
      value={<Skeleton className="h-6 my-1 w-20" />}
    >
      {type === 'bar' ? (
        <LoadingBarChart height={100} />
      ) : (
        <LoadingAreaChart height={100} />
      )}
    </OverallStatsCardContainer>
  );
};

const OverallStatsCardContainer = ({
  title,
  children,
  value,
}: {
  title: string;
  children: React.ReactNode;
  value: React.ReactNode;
}) => {
  return (
    <Card className="overflow-hidden flex flex-col gap-2">
      <CardHeader className="space-y-0 bg-muted border-b">
        <CardDescription>{title}</CardDescription>
        {value}
      </CardHeader>
      {children}
    </Card>
  );
};
