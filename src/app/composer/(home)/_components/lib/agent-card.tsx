import {
  BotMessageSquare,
  DollarSign,
  MessagesSquare,
  Users,
  Wrench,
} from 'lucide-react';

import Link from 'next/link';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Favicons, LoadingFavicons } from '@/app/_components/favicon';

import type { RouterOutputs } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';
import type { Route } from 'next';

interface Props<T extends string> {
  agentConfiguration: RouterOutputs['public']['agents']['list']['items'][number];
  href?: Route<T>;
}

export const AgentCard = <T extends string>({
  agentConfiguration,
  href,
}: Props<T>) => {
  return (
    <Link
      href={href ?? (`/composer/agent/${agentConfiguration.id}` as Route<T>)}
    >
      <Card className="hover:border-primary transition-colors overflow-hidden flex flex-col justify-between h-full">
        <CardHeader className="border-b flex-1">
          <div className="flex flex-row items-center gap-3">
            {agentConfiguration.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agentConfiguration.image}
                alt={agentConfiguration.name}
                className="size-5 rounded-md object-cover bg-muted"
              />
            ) : (
              <BotMessageSquare className="size-5" />
            )}
            <CardTitle>{agentConfiguration.name || 'Untitled'}</CardTitle>
          </div>
          <CardDescription className="text-xs line-clamp-2">
            {agentConfiguration.description &&
            agentConfiguration.description.length > 0
              ? agentConfiguration.description
              : 'No description'}
          </CardDescription>
        </CardHeader>
        <div
          className={cn(
            'grid overflow-hidden relative md:col-span-2',
            'grid-cols-2',
            '[&>*:nth-child(odd)]:border-r',
            '[&>*:nth-child(-n+2)]:border-b'
          )}
        >
          <StatCard title="Tools" Icon={Wrench}>
            <Favicons
              favicons={agentConfiguration.resources.map(
                resource => resource.originFavicon ?? null
              )}
              iconContainerClassName="size-4 bg-card mt-1"
            />
          </StatCard>
          <StatCard title="Users" Icon={Users}>
            {agentConfiguration.user_count}
          </StatCard>
          <StatCard title="Requests" Icon={MessagesSquare}>
            {agentConfiguration.message_count}
          </StatCard>
          <StatCard title="Tool Calls" Icon={DollarSign}>
            {agentConfiguration.tool_call_count}
          </StatCard>
        </div>
      </Card>
    </Link>
  );
};

interface Stat {
  title: string;
  Icon: LucideIcon;
}

interface StatsCardProps extends Stat {
  children: React.ReactNode;
}

const StatCard = ({ children, ...stat }: StatsCardProps) => {
  return <BaseStatCard {...stat}>{children}</BaseStatCard>;
};

const BaseStatCard = ({
  title,
  children,
}: Stat & {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-row justify-between items-center flex-1 px-2 py-1">
      <p className="text-[10px] font-medium leading-none">{title}</p>
      <div className="gap-1 flex items-center justify-start text-sm font-bold font-mono">
        {children}
      </div>
    </div>
  );
};

export const LoadingAgentCard = () => {
  return (
    <Card className="overflow-hidden flex flex-col justify-between h-full">
      <CardHeader className="border-b flex-1">
        <div className="flex flex-row items-center gap-3">
          <Skeleton className="size-5" />
          <Skeleton className="w-16 h-4" />
        </div>
        <Skeleton className="w-full h-4" />
      </CardHeader>
      <div
        className={cn(
          'grid overflow-hidden relative md:col-span-2',
          'grid-cols-2',
          '[&>*:nth-child(odd)]:border-r',
          '[&>*:nth-child(-n+2)]:border-b'
        )}
      >
        <StatCard title="Tools" Icon={Wrench}>
          <LoadingFavicons
            count={3}
            orientation="horizontal"
            iconContainerClassName="size-4 bg-card mt-1"
          />
        </StatCard>
        <StatCard title="Users" Icon={Users}>
          <Skeleton className="w-8 h-4" />
        </StatCard>
        <StatCard title="Requests" Icon={MessagesSquare}>
          <Skeleton className="w-8 h-4" />
        </StatCard>
        <StatCard title="Tool Calls" Icon={DollarSign}>
          <Skeleton className="w-8 h-4" />
        </StatCard>
      </div>
    </Card>
  );
};
