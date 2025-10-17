import { Suspense } from 'react';

import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

import { NavMain } from './main';
import { LoadingNavChats, NavChats, UnauthedNavChats } from './chats';
import {
  AgentSelect,
  LoadingAgentSelect,
  UnauthedAgentSelect,
} from './agent-select';
import { Wallet } from './wallet';

import { auth } from '@/auth';

import { api, HydrateClient } from '@/trpc/server';
import { LoadingWalletButton } from './wallet/button';

export async function Sidebar({
  ...props
}: React.ComponentProps<typeof BaseSidebar>) {
  const session = await auth();

  if (session?.user) {
    void api.agentConfigurations.getUserConfigurations.prefetch();
    void api.chats.getUserChats.prefetchInfinite();
  }

  return (
    <HydrateClient>
      <BaseSidebar
        collapsible="icon"
        className="relative h-full min-h-full max-h-full bg-card"
        {...props}
      >
        <SidebarHeader className="border-sidebar-border border-b p-3 group-data-[collapsible=icon]:p-2">
          <div className="group-data-[collapsible=icon]:mt-1">
            {session ? (
              <Suspense fallback={<LoadingAgentSelect />}>
                <AgentSelect />
              </Suspense>
            ) : (
              <UnauthedAgentSelect />
            )}
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-0 pt-2">
          <NavMain />
          {session ? (
            <Suspense fallback={<LoadingNavChats />}>
              <NavChats />
            </Suspense>
          ) : (
            <UnauthedNavChats />
          )}
        </SidebarContent>
        <SidebarFooter className="flex flex-col gap-2 p-3 group-data-[collapsible=icon]:p-2">
          {session?.user.id && (
            <Suspense fallback={<LoadingWalletButton />}>
              <Wallet />
            </Suspense>
          )}
        </SidebarFooter>
        <SidebarRail />
      </BaseSidebar>
    </HydrateClient>
  );
}
