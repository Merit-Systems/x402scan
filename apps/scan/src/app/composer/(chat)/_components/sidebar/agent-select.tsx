'use client';

import * as React from 'react';

import Link from 'next/link';
import Image from 'next/image';

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
import { Loading } from '@/components/ui/loading';
import { useState } from 'react';

export const AgentSelect = () => {
  const { isMobile, setOpenMobile, openMobile } = useSidebar();

  const [agentConfigurations] =
    api.user.agentConfigurations.list.useSuspenseQuery();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isOpen} onOpenChange={open => setIsOpen(open)}>
            <DropdownMenuTrigger asChild>
              <AgentSelectButton onClick={() => setIsOpen(true)} />
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
              <DropdownMenuItem
                className="gap-2 p-2"
                asChild
                onClick={() => isMobile && openMobile && setOpenMobile(false)}
              >
                <Link href="/composer/chat">
                  <BotMessageSquare className="size-4 flex-shrink-0" />
                  <span className="truncate font-medium">Playground</span>
                </Link>
              </DropdownMenuItem>
              {agentConfigurations.map(agent => (
                <DropdownMenuItem
                  key={agent.id}
                  className="gap-2 p-2"
                  asChild
                  onClick={() => isMobile && openMobile && setOpenMobile(false)}
                >
                  <Link
                    href={`/composer/agent/${agent.agentConfiguration.id}/chat`}
                    key={agent.id}
                  >
                    {agent.agentConfiguration.image ? (
                      <Image
                        src={agent.agentConfiguration.image}
                        alt={agent.agentConfiguration.name}
                        width={16}
                        height={16}
                        className="size-4 flex-shrink-0"
                      />
                    ) : (
                      <BotMessageSquare className="size-4 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">
                      {agent.agentConfiguration.name || 'Untitled Agent'}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Link href="/composer/agent/new">
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
  return (
    <SidebarGroup className="p-0">
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
    pathname.includes('/composer/agent/') &&
    !pathname.includes('/composer/agent/new');
  const agentId = pathname.split('/')[3];

  const { data: agentConfiguration, isLoading: isAgentConfigurationLoading } =
    api.public.agents.get.useQuery(agentId, {
      enabled: isAgent,
    });

  return (
    <SidebarMenuButton
      ref={ref}
      size="lg"
      className={cn(
        'bg-transparent text-sidebar-accent-foreground cursor-pointer transition-all duration-200 ease-in-out border',
        open ? 'justify-between px-4' : 'justify-center'
      )}
      onClick={onClick}
    >
      {open ? (
        <>
          <div className="min-w-0 flex-1 gap-2 flex items-center">
            {isAgent ? (
              <>
                <Loading
                  value={agentConfiguration?.image ?? undefined}
                  isLoading={isAgentConfigurationLoading}
                  component={image => (
                    <Image
                      src={image}
                      alt="Agent"
                      width={16}
                      height={16}
                      className="size-4 flex-shrink-0 rounded-md"
                    />
                  )}
                  loadingComponent={
                    <Skeleton className="size-4 flex-shrink-0" />
                  }
                  errorComponent={
                    <BotMessageSquare className="size-4 flex-shrink-0" />
                  }
                />
                <Loading
                  value={agentConfiguration?.name}
                  isLoading={isAgentConfigurationLoading}
                  component={name => (
                    <span className="truncate">{name || 'Untitled Agent'}</span>
                  )}
                  loadingComponent={<Skeleton className="h-4 w-24" />}
                  errorComponent={<span className="truncate">Agent</span>}
                />
              </>
            ) : (
              <>
                <BotMessageSquare className="size-4 flex-shrink-0" />
                <span className="truncate">Playground</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-auto size-4 flex-shrink-0" />
        </>
      ) : (
        <BotMessageSquare className="size-4" />
      )}
    </SidebarMenuButton>
  );
});

AgentSelectButton.displayName = 'AgentSelectButton';

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
