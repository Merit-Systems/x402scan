import { v4 as uuidv4 } from 'uuid';

import { Chat } from '../_components/chat';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const id = uuidv4();

  return <Chat id={id} initialMessages={[]} />;
}
