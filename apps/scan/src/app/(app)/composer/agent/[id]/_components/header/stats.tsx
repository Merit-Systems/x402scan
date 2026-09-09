import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompactAgo } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/client";
import {
  Calendar,
  MessagesSquare,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type Config = NonNullable<RouterOutputs["public"]["agents"]["get"]>;

interface Props {
  agentConfiguration: Config;
}

const statCards = [
  {
    title: "Users",
    Icon: Users,
    getValue: (config: Config) => config.userCount.toString(),
  },
  {
    title: "Messages",
    Icon: MessagesSquare,
    getValue: (config: Config) => config.messageCount.toString(),
  },
  {
    title: "Tool Calls",
    Icon: Wrench,
    getValue: (config: Config) => config.toolCallCount.toString(),
  },
  {
    title: "Created",
    Icon: Calendar,
    getValue: (config: Config) => formatCompactAgo(config.createdAt),
  },
] as const;

export const AgentStats: React.FC<Props> = ({ agentConfiguration }) => {
  return (
    <AgentStatsContainer>
      {statCards.map(({ title, Icon, getValue }) => (
        <StatCard
          key={title}
          title={title}
          Icon={Icon}
          value={getValue(agentConfiguration)}
        />
      ))}
    </AgentStatsContainer>
  );
};

export const LoadingAgentStats = () => {
  return (
    <AgentStatsContainer>
      {statCards.map(({ title, Icon }) => (
        <LoadingStatCard key={title} title={title} Icon={Icon} />
      ))}
    </AgentStatsContainer>
  );
};

const AgentStatsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "grid overflow-hidden h-full relative",
        "grid-cols-2 md:grid-cols-1",
        "rounded-b-lg md:rounded-bl-none md:rounded-r-lg",
        "border-t md:border-l md:border-t-0",
        "[&>*:nth-child(odd)]:border-r md:[&>*:nth-child(odd)]:border-r-0",
        "[&>*:nth-child(-n+2)]:border-b md:[&>*:not(:last-child)]:border-b"
      )}
    >
      {children}
    </div>
  );
};

interface BaseStatCardProps {
  title: string;
  value: React.ReactNode;
  Icon: LucideIcon;
}

const BaseStatCard: React.FC<BaseStatCardProps> = ({ title, value, Icon }) => {
  return (
    <div className="flex flex-1 items-center justify-between gap-2 px-2 py-1 md:px-4">
      <div className="flex items-center gap-1 text-muted-foreground md:gap-2">
        <Icon className="size-3 shrink-0 md:size-4" />
        <span className="text-xs font-medium tracking-wider md:text-sm">
          {title}
        </span>
      </div>
      {value}
    </div>
  );
};

type StatsCardProps = {
  value: string;
} & Omit<BaseStatCardProps, "value">;

const StatCard: React.FC<StatsCardProps> = ({ title, Icon, value }) => {
  return (
    <BaseStatCard
      title={title}
      value={
        <div className="font-mono text-sm font-bold md:text-lg">{value}</div>
      }
      Icon={Icon}
    />
  );
};

const LoadingStatCard: React.FC<Omit<BaseStatCardProps, "value">> = ({
  title,
  Icon,
}) => {
  return (
    <BaseStatCard
      title={title}
      value={<Skeleton className="my-[4px] h-[16px] w-8" />}
      Icon={Icon}
    />
  );
};
