import {
  BotMessageSquare,
  DollarSign,
  MessagesSquare,
  Users,
  Wrench,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Favicons, LoadingFavicons } from "@/app/(app)/_components/favicon";

import type { RouterOutputs } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";
interface Props {
  agentConfiguration: RouterOutputs["public"]["agents"]["list"]["items"][number];
  href?: `/composer/agent/${string}` | `/composer/agent/${string}/chat`;
}

export const AgentCard = ({ agentConfiguration, href }: Props) => {
  const route = href ?? `/composer/agent/${agentConfiguration.id}`;
  return (
    <Link href={route}>
      <Card className="flex h-full flex-col justify-between overflow-hidden">
        <CardHeader className="flex-1">
          <div className="flex flex-row items-center gap-3">
            {agentConfiguration.image ? (
              <Image
                src={agentConfiguration.image}
                alt={agentConfiguration.name}
                width={20}
                height={20}
                unoptimized
                className="size-5 rounded-md bg-muted object-cover"
              />
            ) : (
              <BotMessageSquare className="size-5" />
            )}
            <CardTitle>{agentConfiguration.name || "Untitled"}</CardTitle>
          </div>
          <CardDescription className="line-clamp-2">
            {agentConfiguration.description &&
            agentConfiguration.description.length > 0
              ? agentConfiguration.description
              : "No description"}
          </CardDescription>
        </CardHeader>
        <div
          className={cn(
            "grid overflow-hidden relative md:col-span-2",
            "grid-cols-2",
            "[&>*:nth-child(odd)]:border-r",
            "[&>*:nth-child(-n+2)]:border-b"
          )}
        >
          <StatCard title="Tools" Icon={Wrench}>
            <Favicons
              favicons={agentConfiguration.resources.map(
                (resource) => resource.originFavicon ?? null
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

type StatsCardProps = {
  children: React.ReactNode;
} & Stat;

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
    <div className="flex flex-1 flex-row items-center justify-between px-2 py-1">
      <span className="type-micro">{title}</span>
      <div className="type-numeric type-emphasis flex items-center justify-start gap-1 type-label">
        {children}
      </div>
    </div>
  );
};

export const LoadingAgentCard = () => {
  return (
    <Card className="flex h-full flex-col justify-between overflow-hidden">
      <CardHeader className="flex-1">
        <div className="flex flex-row items-center gap-3">
          <Skeleton className="size-5" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <div
        className={cn(
          "grid overflow-hidden relative md:col-span-2",
          "grid-cols-2",
          "[&>*:nth-child(odd)]:border-r",
          "[&>*:nth-child(-n+2)]:border-b"
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
          <Skeleton className="h-4 w-8" />
        </StatCard>
        <StatCard title="Requests" Icon={MessagesSquare}>
          <Skeleton className="h-4 w-8" />
        </StatCard>
        <StatCard title="Tool Calls" Icon={DollarSign}>
          <Skeleton className="h-4 w-8" />
        </StatCard>
      </div>
    </Card>
  );
};
