import { auth } from '@/auth';
import { api } from '@/trpc/server';
import type { Chat } from '@prisma/client';
import { convertToUIMessages } from '@/lib/utils';
import type { UIMessage } from 'ai';

export interface ServerChatData {
  currentChat: Chat | null;
  chatMessages: UIMessage[];
  usdcBalance: number | null;
  isAuthed: boolean;
  userChats: Chat[];
}

export async function getServerChatData(
  chatId?: string
): Promise<ServerChatData> {
  const session = await auth();
  const isAuthed = !!session?.user?.id;

  if (!isAuthed) {
    return {
      currentChat: null,
      chatMessages: [],
      usdcBalance: null,
      isAuthed: false,
      userChats: [],
    };
  }

  const userId = session.user.id;

  // Fetch data in parallel
  const [currentChat, userChats, usdcBalance] = await Promise.all([
    // Get or create chat using TRPC
    api.chats.getOrCreateChat({
      chatId,
      title: 'New Chat',
      visibility: 'private',
    }),
    // Get user's chats using TRPC
    api.chats.getUserChats(),
    // Get wallet balance
    api.serverWallet.usdcBaseBalance(),
  ]);

  // Verify chat ownership if chatId was provided
  if (chatId && currentChat && currentChat.userId !== userId) {
    throw new Error('Chat not found or access denied');
  }

  const chatMessages = currentChat?.messages
    ? convertToUIMessages(currentChat.messages)
    : [];

  return {
    currentChat,
    chatMessages,
    usdcBalance,
    isAuthed: true,
    userChats,
  };
}
