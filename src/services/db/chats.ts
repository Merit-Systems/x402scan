import { z } from 'zod';

import { prisma } from './client';

import type { Prisma } from '@prisma/client';

export const createChat = async (data: Prisma.ChatCreateInput) => {
  return await prisma.chat.create({
    data: data,
    include: {
      messages: true,
    },
  });
};

export const getChat = async (id: string, userId: string) => {
  return await prisma.chat.findUnique({
    where: { id, OR: [{ userId }, { visibility: 'public' }] },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

export const getChatsByUserId = async (userId: string) => {
  return await prisma.chat.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

export const updateChatSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

export const updateChat = async (
  userId: string,
  updateChatData: z.infer<typeof updateChatSchema>
) => {
  const { id, ...data } = updateChatSchema.parse(updateChatData);
  return await prisma.chat.update({
    where: { id, userId },
    data,
  });
};

export const deleteChat = async (id: string, userId: string) => {
  return await prisma.chat.delete({
    where: { id, userId },
  });
};

// Message CRUD operations
export const createMessage = async (data: Prisma.MessageCreateInput) => {
  return await prisma.message.create({
    data,
  });
};
