import { parseUnits } from '@coinbase/cdp-sdk';
import { scanDb } from '@x402scan/scan-db';
import z from 'zod';

// Characters that avoid confusion (no 0/O, 1/I/L)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateInviteCode = (): string => {
  let code = 'MRT-';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
};

export const createInviteCodeSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  amount: z.string().transform(val => parseUnits(val, 6)),
  maxRedemptions: z.number().int().min(0).default(1),
  uniqueRecipients: z.boolean().default(false),
  expiresAt: z.date().optional(),
  note: z.string().optional(),
});

export const createInviteCode = async (
  createdById: string,
  { code, ...input }: z.infer<typeof createInviteCodeSchema>
) => {
  return scanDb.inviteCode.create({
    data: {
      ...input,
      code: code ?? generateInviteCode(),
      createdById,
    },
  });
};
