'use client';

import * as React from 'react';

import Link from 'next/link';

import { BotMessageSquare, ChevronsUpDown, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

import { usePathname } from 'next/navigation';

import { api } from '@/trpc/client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const AgentSelect = () => {
  const { isMobile, open } = useSidebar();

  const pathname = usePathname();

  const agentId = pathname.split('/')[2];

  const [agentConfigurations, { isLoading }] =
    api.agentConfigurations.getUserConfigurations.useSuspenseQuery(undefined);

  const agent = agentConfigurations.find(agent => agent.id === agentId);

  const isAgent = agent !== undefined;

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'bg-transparent text-sidebar-accent-foreground cursor-pointer transition-all duration-200 ease-in-out border',
                  open ? 'justify-between px-4' : 'justify-center'
                )}
              >
                {open ? (
                  <>
                    <div className="min-w-0 flex-1 gap-2 flex items-center">
                      <BotMessageSquare className="size-4 flex-shrink-0" />
                      <span className="truncate">
                        {isAgent
                          ? isLoading
                            ? 'Loading...'
                            : 'Agent'
                          : 'Playground'}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 flex-shrink-0" />
                  </>
                ) : (
                  <BotMessageSquare className="size-4" />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Agents
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2" asChild>
                <Link href="/">
                  <span className="truncate font-medium">Default Chat</span>
                </Link>
              </DropdownMenuItem>
              {agentConfigurations.map(agent => (
                <DropdownMenuItem
                  key={agent.id}
                  className="justify-between gap-2 p-2"
                  asChild
                >
                  <Link href={`/chat/${agent.id}`} key={agent.id}>
                    <span className="truncate font-medium">{agent.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Link href="/chat/new">
                <DropdownMenuItem className="gap-2 p-2">
                  <Plus className="size-4" />
                  <div className="text-muted-foreground font-medium">
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
  const { open } = useSidebar();

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(
              'bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer transition-all duration-200 ease-in-out',
              open ? 'justify-between' : 'min-h-[2.5rem] justify-center px-2'
            )}
          >
            {open ? (
              <>
                <div className="min-w-0 flex-1 gap-2 flex items-center">
                  <BotMessageSquare className="size-4 flex-shrink-0" />
                  <span className="truncate">Agent</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 flex-shrink-0" />
              </>
            ) : (
              <BotMessageSquare className="size-4" />
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export const LoadingAgentSelect = () => {
  return (
    <SidebarGroup className="p-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className={cn('bg-transparent border')}>
            <div className="min-w-0 flex-1 gap-2 flex items-center">
              <Skeleton className="size-4 flex-shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};
