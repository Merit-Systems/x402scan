import z from 'zod';

import { prisma } from '../client';
import type { OnrampSession } from '@prisma/client';

export const getOnrampSessionByToken = async (
  token: string,
  userId: string
) => {
  return prisma.onrampSession.findUnique({
    where: { token, userId },
  });
};

export const createOnrampSessionSchema = z.object({
  token: z.string(),
  amount: z.number(),
  userId: z.string(),
  serverWalletId: z.string().optional(),
});

export const createOnrampSession = async (
  input: z.input<typeof createOnrampSessionSchema>
) => {
  const { token, amount, userId, serverWalletId } =
    createOnrampSessionSchema.parse(input);

  return prisma.onrampSession.create({
    data: {
      token,
      amount,
      userId,
      ...(serverWalletId ? { serverWalletId } : {}),
    },
  });
};

export const updateOnrampSession = async (
  id: string,
  data: Partial<OnrampSession>
) => {
  return prisma.onrampSession.update({
    where: {
      id,
    },
    data,
  });
};
