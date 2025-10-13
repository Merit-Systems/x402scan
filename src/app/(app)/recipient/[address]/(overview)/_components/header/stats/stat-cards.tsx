import { ArrowLeftRight, Calendar, DollarSign, Users } from 'lucide-react';

import { api } from '@/trpc/server';

import { formatCompactAgo } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import type { LucideIcon } from 'lucide-react';
import { formatTokenAmount } from '@/lib/token';

interface Props {
  address: string;
}

interface Stat {
  title: string;
  Icon: LucideIcon;
}

const stats: Stat[] = [
  { title: 'Requests', Icon: ArrowLeftRight },
  { title: 'Buyers', Icon: Users },
  { title: 'Volume', Icon: DollarSign },
  { title: 'Latest', Icon: Calendar },
];

export const StatsCards: React.FC<Props> = async ({ address }) => {
  const overallStats = await api.stats.getOverallStatistics({
    addresses: [address],
  });

  const values = [
    Number(overallStats.total_transactions).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      notation: 'compact',
    }),
    Number(overallStats.unique_buyers).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      notation: 'compact',
    }),
    formatTokenAmount(BigInt(overallStats.total_amount)),
    formatCompactAgo(overallStats.latest_block_timestamp),
  ];

  return stats.map((stat, index) => (
    <StatCard key={stat.title} {...stat} value={values[index]} />
  ));
};

export const LoadingStatsCards = () => {
  return stats.map(stat => <LoadingStatCard {...stat} key={stat.title} />);
};

interface StatsCardProps extends Stat {
  value: string;
}

const StatCard = ({ value, ...stat }: StatsCardProps) => {
  return (
    <BaseStatCard {...stat}>
      <div className="text-lg font-bold font-mono">{value}</div>
    </BaseStatCard>
  );
};

const LoadingStatCard = (stat: Stat) => {
  return (
    <BaseStatCard {...stat}>
      <Skeleton className="w-16 h-[28px]" />
    </BaseStatCard>
  );
};

const BaseStatCard = ({
  title,
  Icon,
  children,
}: Stat & {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex justify-between flex-1 px-4 gap-2 py-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span className="text-xs font-medium tracking-wider">{title}</span>
      </div>
      <div className="gap-1 flex items-center">{children}</div>
    </div>
  );
};
