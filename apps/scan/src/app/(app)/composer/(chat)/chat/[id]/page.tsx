import { Suspense } from "react";
import { LoadingMessagesChat } from "../../_components/chat/content";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { api } from "@/trpc/server";

import { Chat } from "../_components/chat";

export default function ChatPage(props: PageProps<"/composer/chat/[id]">) {
  return (
    <Suspense fallback={<LoadingMessagesChat />}>
      <ChatData {...props} />
    </Suspense>
  );
}

async function ChatData({ params }: PageProps<"/composer/chat/[id]">) {
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
