import { connection } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { Chat } from "../_components/chat";

export default async function ChatPage() {
  await connection();
  const id = uuidv4();

  return <Chat id={id} initialMessages={[]} />;
}
