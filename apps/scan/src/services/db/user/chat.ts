import { prisma } from '../client';

export const getUserMessageCount = async (userId: string) => {
  return await prisma.message.count({
    where: {
      chat: {
        userId: userId,
      },
      role: 'user',
    },
  });
};

export const getUserToolCallCount = async (userId: string) => {
  return await prisma.toolCall.count({
    where: {
      chat: {
        userId: userId,
      },
    },
  });
};
