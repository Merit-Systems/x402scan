import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { AgentChat } from '../_components/chat';
import { auth } from '@/auth';

export default async function AgentPage({
  params,
}: PageProps<'/composer/agent/[id]/chat/[chatId]'>) {
  const { id, chatId } = await params;

  const [session, agentConfiguration, chat] = await Promise.all([
    auth(),
    api.public.agents.get(id),
    api.public.chats.get(chatId),
  ]);

  if (!agentConfiguration || !chat) {
    return notFound();
  }

  if (chat.userAgentConfiguration?.agentConfigurationId !== id) {
    return notFound();
  }

  return (
    <AgentChat
      id={chatId}
      initialMessages={chat.messages}
      agentConfig={agentConfiguration}
      isReadOnly={chat.userId !== session?.user.id}
    />
  );
}
