import { Suspense } from "react";
import { LoadingEmptyChat } from "../../_components/chat/content";
import { connection } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { Chat } from "../_components/chat";

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingEmptyChat />}>
      <ChatData />
    </Suspense>
  );
}

async function ChatData() {
  await connection();
  const id = uuidv4();

  return <Chat id={id} initialMessages={[]} />;
}
