'use client';

import { useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';

import { ChatItem, LoadingChatItem } from './item';

import { api } from '@/trpc/client';

export const NavChats = () => {
  const router = useRouter();
  const pathname = usePathname();

  const { setOpenMobile, state } = useSidebar();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: chats, isLoading } = api.user.chats.list.useQuery({
    agentId:
      pathname.includes('/composer/agent/') &&
      !pathname.includes('/composer/agent/new')
        ? pathname.split('/')[3]
        : undefined,
  });

  const utils = api.useUtils();
  const deleteChat = api.user.chats.delete.useMutation();

  const handleDelete = () => {
    if (deleteId) {
      deleteChat.mutate(
        { chatId: deleteId },
        {
          onSuccess: () => {
            setShowDeleteDialog(false);
            void utils.user.chats.list.invalidate();
            void router.push('/composer/chat');
          },
        }
      );
    }
  };

  if (isLoading) {
    return <LoadingNavChats />;
  }

  if (state === 'collapsed') return null;

  if (!chats || chats.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarMenu>
          <div className="text-muted-foreground px-2 py-2 text-xs">
            No chats yet.
          </div>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarMenu>
          {chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={pathname.endsWith(chat.id)}
              onDelete={id => {
                setDeleteId(id);
                setShowDeleteDialog(true);
              }}
              setOpenMobile={setOpenMobile}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const UnauthedNavChats = () => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarMenu>
        <div className="text-muted-foreground px-2 py-2 text-xs">
          No chats yet.
        </div>
      </SidebarMenu>
    </SidebarGroup>
  );
};

const LoadingNavChats = () => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingChatItem key={index} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
