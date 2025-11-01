import { notFound } from 'next/navigation';

import { Chat } from '../_components/chat';

import { api } from '@/trpc/server';

import { auth } from '@/auth';

export default async function ChatPage({
  params,
}: PageProps<'/composer/chat/[id]'>) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user.id;

  const chat = await api.public.chats.get(id);

  if (!chat) {
    return notFound();
  }

  return (
    <Chat
      id={id}
      initialMessages={chat.messages}
      isReadOnly={chat.userId !== userId}
    />
  );
}
