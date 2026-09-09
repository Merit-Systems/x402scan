import React from "react";

import { BotMessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/ui/image-avatar";

import { AgentStats, LoadingAgentStats } from "./stats";

import { cn } from "@/lib/utils";

import { HeaderButtons, LoadingHeaderButtons } from "./button";

import type { RouterOutputs } from "@/trpc/client";

interface Props {
  agentConfiguration: NonNullable<RouterOutputs["public"]["agents"]["get"]>;
}

export const HeaderCard: React.FC<Props> = ({ agentConfiguration }) => {
  return (
    <Card className={cn("relative mt-10 md:mt-12")}>
      <Card className="absolute top-0 left-4 flex size-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-md border md:size-16">
        <Avatar
          src={agentConfiguration.image}
          className="size-full rounded-md border-none"
          fallback={<BotMessageSquare className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="col-span-5 flex flex-col gap-4 p-4 pt-8 md:pt-10">
          <div className="">
            <h1
              className={cn(
                "text-3xl font-bold break-words line-clamp-2",
                agentConfiguration.name
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {agentConfiguration.name || "Untitled Agent"}
            </h1>
            <p
              className={cn(
                "break-words line-clamp-2",
                agentConfiguration.description &&
                  agentConfiguration.description.length > 0
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {agentConfiguration.description &&
              agentConfiguration.description.length > 0
                ? agentConfiguration.description
                : "No description"}
            </p>
          </div>
          <HeaderButtons agentConfiguration={agentConfiguration} />
        </div>
        <div className="col-span-2">
          <AgentStats agentConfiguration={agentConfiguration} />
        </div>
      </div>
    </Card>
  );
};

export const LoadingHeaderCard = () => {
  return (
    <Card className={cn("relative mt-10 md:mt-12 mb-12")}>
      <Card className="absolute top-0 left-4 flex size-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-md border md:size-16">
        <Avatar
          src={undefined}
          className="size-full"
          fallback={<Skeleton className="size-full" />}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="col-span-5 flex flex-col gap-4 p-4 pt-8 md:pt-10">
          <div className="">
            <Skeleton className="my-[3px] h-[30px] w-36" />
            <Skeleton className="my-[4px] h-[16px] w-64" />
          </div>
          <LoadingHeaderButtons />
        </div>
        <div className="col-span-2">
          <LoadingAgentStats />
        </div>
      </div>
    </Card>
  );
};
