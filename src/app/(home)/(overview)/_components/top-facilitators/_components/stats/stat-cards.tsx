import { ArrowLeftRight, Calendar, DollarSign, Users } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import type { LucideIcon } from 'lucide-react';
import { formatTokenAmount } from '@/lib/token';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  stats: RouterOutputs['public']['facilitators']['list']['items'][number];
}

interface Stat {
  title: string;
  Icon: LucideIcon;
}

const statsData: Stat[] = [
  { title: 'Requests', Icon: ArrowLeftRight },
  { title: 'Volume', Icon: DollarSign },
  { title: 'Buyers', Icon: Users },
  { title: 'Sellers', Icon: Calendar },
];

export const StatsCards: React.FC<Props> = ({ stats }) => {
  const values = [
    stats.tx_count.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      notation: 'compact',
    }),
    formatTokenAmount(BigInt(stats.total_amount)),
    stats.unique_buyers.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      notation: 'compact',
    }),
    stats.unique_sellers.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      notation: 'compact',
    }),
  ];

  return statsData.map((stat, index) => (
    <StatCard key={stat.title} {...stat} value={values[index]} />
  ));
};

export const LoadingStatsCards = () => {
  return statsData.map(stat => <LoadingStatCard {...stat} key={stat.title} />);
};

interface StatsCardProps extends Stat {
  value: string;
}

const StatCard = ({ value, ...stat }: StatsCardProps) => {
  return (
    <BaseStatCard {...stat}>
      <div className="text-sm font-bold font-mono">{value}</div>
    </BaseStatCard>
  );
};

const LoadingStatCard = (stat: Stat) => {
  return (
    <BaseStatCard {...stat}>
      <Skeleton className="w-16 h-[14px] my-[3px]" />
    </BaseStatCard>
  );
};

const BaseStatCard = ({
  title,
  children,
}: Stat & {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-row justify-between items-center md:flex-col md:justify-center md:items-start flex-1 p-2">
      <p className="text-[10px] font-medium leading-none">{title}</p>
      <div className="gap-1 flex items-center justify-start">{children}</div>
    </div>
  );
};
