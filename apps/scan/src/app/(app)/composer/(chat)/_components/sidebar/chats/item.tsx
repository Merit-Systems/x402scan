import React, { memo } from "react";

import Link from "next/link";

import { MoreHorizontal, Trash } from "lucide-react";

import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import type { RouterOutputs } from "@/trpc/client";

interface Props {
  chat: RouterOutputs["user"]["chats"]["list"][number];
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}

const PureChatItem: React.FC<Props> = ({
  chat,
  isActive,
  setOpenMobile,
  onDelete,
}: Props) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          href={
            chat.userAgentConfiguration?.agentConfigurationId
              ? `/composer/agent/${chat.userAgentConfiguration.agentConfigurationId}/chat/${chat.id}`
              : `/composer/chat/${chat.id}`
          }
          onClick={() => setOpenMobile(false)}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate">{chat.title}</span>
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              className="mr-0.5 cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              showOnHover={!isActive}
            />
          }
        >
          <MoreHorizontal />
          <span className="sr-only">More</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="center" sideOffset={8}>
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
            onSelect={() => onDelete(chat.id)}
          >
            <Trash className="size-4 text-destructive" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});

export const LoadingChatItem = () => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton>
        <Skeleton className="h-5 w-full" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
