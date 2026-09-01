import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import {
  BaseAreaChart,
  LoadingAreaChart,
} from "@/components/ui/charts/chart/area";
import {
  BaseBarChart,
  LoadingBarChart,
} from "@/components/ui/charts/chart/bar";
import type {
  ChartData,
  ChartItems,
  TooltipRowProps,
} from "@/components/ui/charts/chart/types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props<T extends Record<string, number>> {
  title: string;
  value: string;
  items: ChartItems<T>;
  data: ChartData<T>[];
  tooltipRows?: TooltipRowProps<T>[];
}

export const OverallStatsCard = <T extends Record<string, number>>({
  title,
  value,
  items,
  data,
  tooltipRows,
}: Props<T>) => {
  return (
    <OverallStatsCardContainer
      title={title}
      value={<div className="type-banner-metric">{value}</div>}
    >
      {items.type === "bar" ? (
        <BaseBarChart
          data={data}
          bars={items.bars}
          height={80}
          tooltipRows={tooltipRows}
          cursor={false}
        />
      ) : (
        <BaseAreaChart
          data={data}
          areas={items.areas}
          height={80}
          tooltipRows={tooltipRows}
          cursor={false}
        />
      )}
    </OverallStatsCardContainer>
  );
};

export const LoadingOverallStatsCard = ({
  type,
  title,
}: {
  type: "bar" | "area";
  title: string;
}) => {
  return (
    <OverallStatsCardContainer
      title={title}
      value={<Skeleton className="my-1 h-6 w-20" />}
    >
      {type === "bar" ? (
        <LoadingBarChart height={80} />
      ) : (
        <LoadingAreaChart height={80} />
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
    <Card>
      <CardHeader className="gap-0">
        <CardDescription>{title}</CardDescription>
        {value}
      </CardHeader>
      {children}
    </Card>
  );
};
