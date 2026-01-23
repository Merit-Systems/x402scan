import { z } from 'zod';
import { scanDb, Prisma } from '@x402scan/scan-db';

export const getMcpUserByWallet = async (wallet: string) => {
  return scanDb.mcpUser.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });
};

export const upsertMcpUserSchema = z.object({
  wallet: z.string(),
  name: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const upsertMcpUser = async (
  input: z.infer<typeof upsertMcpUserSchema>
) => {
  const wallet = input.wallet.toLowerCase();
  const metadata = input.metadata
    ? (input.metadata as Prisma.InputJsonValue)
    : Prisma.JsonNull;

  return scanDb.mcpUser.upsert({
    where: { wallet },
    create: {
      wallet,
      name: input.name,
      metadata: input.metadata ? metadata : undefined,
    },
    update: {
      name: input.name,
      metadata: input.metadata ? metadata : undefined,
    },
  });
};
