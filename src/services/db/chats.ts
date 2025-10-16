import type { Prisma } from '@prisma/client';
import { prisma } from './client';

// Chat CRUD operations
export const createChat = async (data: Prisma.ChatCreateInput) => {
  return await prisma.chat.create({
    data,
    include: {
      messages: true,
    },
  });
};

export const getChatById = async (id: string) => {
  return await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
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

export const updateChat = async (id: string, data: Prisma.ChatUpdateInput) => {
  return await prisma.chat.update({
    where: { id },
    data,
  });
};

export const deleteChat = async (id: string) => {
  return await prisma.chat.delete({
    where: { id },
  });
};

// Message CRUD operations
export const createMessage = async (data: Prisma.MessageCreateInput) => {
  return await prisma.message.create({
    data,
  });
};
