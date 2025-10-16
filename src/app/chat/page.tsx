import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { api } from '@/trpc/server';

export default async function ChatPage() {
  const session = await auth();

  // If not authenticated, redirect to home
  if (!session?.user?.id) {
    redirect('/');
  }

  // Create a new chat and redirect to it
  const newChat = await api.chats.getOrCreateChat({
    title: 'New Chat',
    visibility: 'private',
  });

  redirect(`/chat/${newChat.id}`);
}
