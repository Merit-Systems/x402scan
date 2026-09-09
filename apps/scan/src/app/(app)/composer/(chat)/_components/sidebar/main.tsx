"use client";

import Link from "next/link";

import { Edit, Settings } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/client";

export const NavMain = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAgent =
    pathname.includes("/composer/agent/") &&
    !pathname.includes("/composer/agent/new");
  const agentId = pathname.split("/")[3];

  const { data: agentConfiguration } = api.public.agents.get.useQuery(
    agentId ?? "",
    {
      enabled: isAgent && !!session?.user.id,
    }
  );

  const newChatUrl = isAgent
    ? (`/composer/agent/${String(agentId)}/chat` as const)
    : ("/composer/chat" as const);

  const items = [
    {
      title: "New Chat",
      url: newChatUrl,
      icon: Edit,
    },
    ...(isAgent && session?.user.id === agentConfiguration?.ownerId
      ? [
          {
            title: "Edit Agent",
            url: `/composer/agent/${String(agentId)}/edit` as const,
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              key={item.title}
              tooltip={item.title}
              render={<Link href={item.url} />}
              onClick={() => {
                if (pathname === item.url) {
                  router.refresh();
                }
              }}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
