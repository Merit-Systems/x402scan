import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { api } from "@/trpc/server";

import { AgentChat } from "../_components/chat";

export default async function AgentPage({
  params,
}: PageProps<"/composer/agent/[id]/chat">) {
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
