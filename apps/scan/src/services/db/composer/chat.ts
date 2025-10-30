import { z } from 'zod';

import { prisma } from '../client';

import type { Prisma } from '@prisma/client';

export const createChat = async (data: Prisma.ChatCreateInput) => {
  return await prisma.chat.create({
    data: data,
    include: {
      messages: true,
    },
  });
};

export const getChat = async (id: string, userId?: string) => {
  return await prisma.chat.findFirst({
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
  return await prisma.chat.findFirst({
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
  return await prisma.chat.findMany({
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
  return await prisma.chat.update({
    where: { id: chatId, userId },
    data: updateChatData,
  });
};

export const deleteChat = async (id: string, userId: string) => {
  return await prisma.chat.delete({
    where: { id, userId },
  });
};
