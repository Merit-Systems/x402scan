import { scanDb } from '@x402scan/scan-db';
import z from 'zod';

// Characters that avoid confusion (no 0/O, 1/I/L)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateInviteCode = (): string => {
  let code = 'MRT-';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
};

export const createInviteCodeSchema = z.object({
  code: z.string().optional(),
  amount: z.bigint(),
  maxRedemptions: z.number().int().min(0).default(1),
  uniqueRecipients: z.boolean().default(false),
  expiresAt: z.date().optional(),
  note: z.string().optional(),
  createdById: z.string(),
});

export type CreateInviteCodeInput = z.infer<typeof createInviteCodeSchema>;

export const createInviteCode = async (input: CreateInviteCodeInput) => {
  const validated = createInviteCodeSchema.parse(input);

  const code = validated.code ?? generateInviteCode();

  return scanDb.inviteCode.create({
    data: {
      code,
      amount: validated.amount,
      maxRedemptions: validated.maxRedemptions,
      uniqueRecipients: validated.uniqueRecipients,
      expiresAt: validated.expiresAt,
      note: validated.note,
      createdById: validated.createdById,
    },
  });
};
