import { Suspense } from 'react';

import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

import { NavMain } from './main';
import { NavChats, UnauthedNavChats } from './chats';
import {
  AgentSelect,
  LoadingAgentSelect,
  UnauthedAgentSelect,
} from './agent-select';

import { auth } from '@/auth';

import { api, HydrateClient } from '@/trpc/server';

export async function Sidebar({
  ...props
}: React.ComponentProps<typeof BaseSidebar>) {
  const session = await auth();

  if (session?.user) {
    void api.user.agentConfigurations.list.prefetch();
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
          {session ? <NavChats /> : <UnauthedNavChats />}
        </SidebarContent>
        <SidebarRail />
      </BaseSidebar>
    </HydrateClient>
  );
}
