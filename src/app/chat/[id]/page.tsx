import Chat from '@/app/_components/chat/chat';
import { getServerChatData } from '@/lib/server-data';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const serverData = await getServerChatData(id);

  return <Chat serverData={serverData} chatId={id} />;
}
