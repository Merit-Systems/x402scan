import { notFound, unauthorized } from 'next/navigation';

import { Chat } from '../_components/chat';

import { api } from '@/trpc/server';

import { auth } from '@/auth';

export default async function ChatPage({ params }: PageProps<'/chat/[id]'>) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const userId = session.user.id;

  const chat = await api.chats.getChat(id);

  if (!chat) {
    return notFound();
  }

  return (
    <Chat
      id={id}
      initialMessages={chat.messages}
      isReadOnly={chat.userId !== userId}
      storePreferences={true}
    />
  );
}
