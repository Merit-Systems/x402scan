import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { AgentChat } from '../_components/chat';

import { v4 as uuidv4 } from 'uuid';

export default async function AgentPage({
  params,
}: PageProps<'/composer/agent/[id]'>) {
  const { id } = await params;

  const agentConfiguration = await api.public.agents.get(id);

  if (!agentConfiguration) {
    return notFound();
  }

  const chatId = uuidv4();

  return (
    <AgentChat
      id={chatId}
      initialMessages={[]}
      agentConfig={agentConfiguration}
      isReadOnly={false}
    />
  );
}
