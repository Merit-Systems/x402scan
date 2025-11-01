'use client';

import { Bot, HardDrive, Tag, Wallet } from 'lucide-react';

import { api } from '@/trpc/client';

import { Addresses } from '@/components/ui/address';
import { Skeleton } from '@/components/ui/skeleton';

import { Tags } from '@/app/_components/tags';

import type { LucideIcon } from 'lucide-react';
import type { Tag as TagType } from '@prisma/client';

interface Props {
  originId: string;
}

interface Stat {
  title: string;
  Icon: LucideIcon;
}

const stats: Stat[] = [
  { title: 'Resources', Icon: HardDrive },
  { title: 'Agents', Icon: Bot },
  { title: 'Tags', Icon: Tag },
  { title: 'Addresses', Icon: Wallet },
];

export const StatsCards: React.FC<Props> = ({ originId }) => {
  const [metadata] = api.public.origins.getMetadata.useSuspenseQuery(originId);
  if (!metadata) {
    return null;
  }

  const values = [
    metadata.resources.length,
    metadata.resources.reduce(
      (acc, resource) => acc + resource._count.agentConfigurationResources,
      0
    ),
    <Tags
      key="tags"
      tags={
        Array.from(
          new Set(
            metadata.resources.flatMap(resource =>
              resource.tags.map(tag => tag.tag.id)
            )
          )
        )
          .map(tagId =>
            metadata.resources
              .flatMap(resource => resource.tags.map(tag => tag.tag))
              .find(tag => tag.id === tagId)
          )
          .filter(Boolean) as TagType[]
      }
      className="min-h-[28px] items-center"
    />,
    <Addresses
      key="addresses"
      addresses={Array.from(
        new Set(
          metadata.resources.flatMap(resource =>
            resource.accepts.map(accept => accept.payTo)
          )
        )
      )}
      className="text-base md:text-lg"
    />,
  ];

  return stats.map((stat, index) => (
    <StatCard key={stat.title} {...stat} value={values[index]} />
  ));
};

export const LoadingStatsCards = () => {
  return stats.map(stat => <LoadingStatCard {...stat} key={stat.title} />);
};

interface StatsCardProps extends Stat {
  value: React.ReactNode;
}

const StatCard = ({ value, ...stat }: StatsCardProps) => {
  return (
    <BaseStatCard {...stat}>
      <div className="text-base md:text-lg font-bold font-mono">{value}</div>
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
    <div className="flex flex-col md:flex-row justify-between flex-1 px-4 gap-1 md:gap-2 py-2 md:py-1 h-full">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span className="text-xs font-medium tracking-wider">{title}</span>
      </div>
      <div className="gap-1 flex items-center">{children}</div>
    </div>
  );
};
