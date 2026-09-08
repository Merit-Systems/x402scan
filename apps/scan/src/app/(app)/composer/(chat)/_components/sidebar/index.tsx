import { Suspense } from "react";

import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { auth } from "@/auth";
import { api, HydrateClient } from "@/trpc/server";

import {
  AgentSelect,
  LoadingAgentSelect,
  UnauthedAgentSelect,
} from "./agent-select";
import { NavChats, LoadingNavChats, UnauthedNavChats } from "./chats";
import { NavMain } from "./main";

export function Sidebar(props: React.ComponentProps<typeof BaseSidebar>) {
  return (
    <Suspense fallback={<LoadingSidebar {...props} />}>
      <SidebarContentWithSession {...props} />
    </Suspense>
  );
}

function LoadingSidebar(props: React.ComponentProps<typeof BaseSidebar>) {
  return (
    <BaseSidebar
      collapsible="icon"
      className="relative h-full max-h-full min-h-full"
      {...props}
    >
      <SidebarHeader>
        <div className="group-data-[collapsible=icon]:mt-1">
          <LoadingAgentSelect />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain />
        <LoadingNavChats />
      </SidebarContent>
      <SidebarRail />
    </BaseSidebar>
  );
}

async function SidebarContentWithSession({
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
        className="relative h-full max-h-full min-h-full"
        {...props}
      >
        <SidebarHeader className=" ">
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
        <SidebarContent className="gap-0">
          <NavMain />
          {session ? <NavChats /> : <UnauthedNavChats />}
        </SidebarContent>
        <SidebarRail />
      </BaseSidebar>
    </HydrateClient>
  );
}
