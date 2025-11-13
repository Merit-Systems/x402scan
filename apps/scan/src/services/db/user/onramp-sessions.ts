import z from 'zod';

import { scanDb } from '../../../../../../packages/internal/databases/scan/src';

import type { OnrampSession } from '../../../../../../packages/internal/databases/scan/src';

export const getOnrampSessionByToken = async (
  token: string,
  userId: string
) => {
  return scanDb.onrampSession.findUnique({
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

  return scanDb.onrampSession.create({
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
  return scanDb.onrampSession.update({
    where: {
      id,
    },
    data,
  });
};
