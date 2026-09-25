import z from "zod";

import { scanDb } from "@x402scan/scan-db";

import type { OnrampSession } from "@x402scan/scan-db/types";

export const getOnrampSessionByToken = async (
  token: string,
  userId: string
) => {
  return scanDb.onrampSession.findUnique({
    where: { token, userId },
  });
};

const createOnrampSessionSchema = z.object({
  token: z.string(),
  amount: z.number(),
  userId: z.string(),
});

export const createOnrampSession = async (
  input: z.input<typeof createOnrampSessionSchema>
) => {
  const { token, amount, userId } = createOnrampSessionSchema.parse(input);

  return scanDb.onrampSession.create({
    data: {
      token,
      amount,
      userId,
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
