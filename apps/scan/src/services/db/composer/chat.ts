import { z } from 'zod';

import { scanDb } from '@x402scan/scan-db';

import type { Prisma } from '@x402scan/scan-db';

export const createChat = async (data: Prisma.ChatCreateInput) => {
  return await scanDb.chat.create({
    data: data,
    include: {
      messages: true,
      userAgentConfiguration: {
        select: {
          agentConfigurationId: true,
        },
      },
    },
  });
};

export const getChat = async (id: string, userId?: string) => {
  return await scanDb.chat.findFirst({
    where: { id, OR: [{ userId }, { visibility: 'public' }] },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      userAgentConfiguration: {
        select: {
          agentConfigurationId: true,
        },
      },
    },
  });
};

export const getChatStreamId = async (id: string, userId?: string) => {
  return await scanDb.chat.findFirst({
    where: { id, OR: [{ userId }, { visibility: 'public' }] },
    select: { activeStreamId: true },
  });
};

export const listChatsSchema = z.object({
  agentId: z.uuid().optional(),
});

export const listChats = async (
  userId: string,
  { agentId }: z.infer<typeof listChatsSchema>
) => {
  return await scanDb.chat.findMany({
    where: {
      userId,
      userAgentConfiguration: agentId
        ? { agentConfigurationId: agentId }
        : null,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      userAgentConfiguration: {
        select: {
          agentConfigurationId: true,
        },
      },
    },
  });
};

export const updateChat = async (
  userId: string,
  chatId: string,
  updateChatData: Prisma.ChatUpdateInput
) => {
  return await scanDb.chat.update({
    where: { id: chatId, userId },
    data: updateChatData,
  });
};

export const deleteChat = async (id: string, userId: string) => {
  return await scanDb.chat.delete({
    where: { id, userId },
  });
};
