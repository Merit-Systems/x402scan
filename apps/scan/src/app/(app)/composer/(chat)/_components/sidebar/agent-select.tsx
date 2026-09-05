"use client";

import * as React from "react";

import Link from "next/link";
import Image from "next/image";

import { BotMessageSquare, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { usePathname } from "next/navigation";

import { api } from "@/trpc/client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export const AgentSelect = () => {
  const { isMobile, setOpenMobile, openMobile } = useSidebar();

  const [agentConfigurations] =
    api.user.agentConfigurations.list.useSuspenseQuery();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarGroup className="">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
            }}
          >
            <DropdownMenuTrigger
              render={
                <AgentSelectButton
                  onClick={() => {
                    setIsOpen(true);
                  }}
                />
              }
            ></DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className=" ">Agents</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (isMobile && openMobile) setOpenMobile(false);
                }}
                render={<Link href="/composer/chat" />}
              >
                <BotMessageSquare className="size-4 shrink-0" />
                <span className="type-emphasis truncate type-label">
                  Playground
                </span>
              </DropdownMenuItem>
              {agentConfigurations.map((agent) => (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={() => {
                    if (isMobile && openMobile) setOpenMobile(false);
                  }}
                  render={
                    <Link
                      href={`/composer/agent/${agent.agentConfiguration.id}/chat`}
                      key={agent.id}
                    />
                  }
                >
                  {agent.agentConfiguration.image ? (
                    <Image
                      src={agent.agentConfiguration.image}
                      alt={agent.agentConfiguration.name}
                      width={16}
                      height={16}
                      className="size-4 shrink-0"
                    />
                  ) : (
                    <BotMessageSquare className="size-4 shrink-0" />
                  )}
                  <span className="type-emphasis truncate type-label">
                    {agent.agentConfiguration.name || "Untitled Agent"}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Link href="/composer/agent/new">
                <DropdownMenuItem>
                  <Plus className="size-4" />
                  <div className="type-emphasis type-label text-muted-foreground">
                    New Agent
                  </div>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export const UnauthedAgentSelect = () => {
  return (
    <SidebarGroup className="">
      <SidebarMenu>
        <SidebarMenuItem>
          <AgentSelectButton />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

const AgentSelectButton = React.forwardRef<
  HTMLButtonElement,
  { onClick?: () => void }
>(({ onClick }, ref) => {
  const { open } = useSidebar();

  const pathname = usePathname();

  const isAgent =
    pathname.includes("/composer/agent/") &&
    !pathname.includes("/composer/agent/new");
  const agentId = pathname.split("/")[3];

  const { data: agentConfiguration, isLoading: isAgentConfigurationLoading } =
    api.public.agents.get.useQuery(agentId ?? "", {
      enabled: isAgent,
    });

  return (
    <SidebarMenuButton
      ref={ref}
      size="lg"
      className={cn(
        " cursor-pointer border",
        open ? "justify-between " : "justify-center"
      )}
      onClick={onClick}
    >
      {open ? (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isAgent ? (
              <>
                {isAgentConfigurationLoading ? (
                  <Skeleton className="size-4 shrink-0" />
                ) : agentConfiguration?.image ? (
                  <Image
                    src={agentConfiguration.image}
                    alt="Agent"
                    width={16}
                    height={16}
                    className="size-4 shrink-0 rounded-md"
                  />
                ) : (
                  <BotMessageSquare className="size-4 shrink-0" />
                )}
                {isAgentConfigurationLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="truncate">
                    {agentConfiguration?.name ?? "Agent"}
                  </span>
                )}
              </>
            ) : (
              <>
                <BotMessageSquare className="size-4 shrink-0" />
                <span className="truncate">Playground</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-auto size-4 shrink-0" />
        </>
      ) : (
        <BotMessageSquare className="size-4" />
      )}
    </SidebarMenuButton>
  );
});

AgentSelectButton.displayName = "AgentSelectButton";

export const LoadingAgentSelect = () => {
  return (
    <SidebarGroup className="">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className={cn(" border")}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};
