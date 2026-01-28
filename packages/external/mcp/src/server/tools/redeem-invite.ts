import z from 'zod';
import { mcpError, mcpSuccessStructuredJson } from './response';

import { redeemInviteCode } from '@/shared/redeem-invite';

import type { RegisterTools } from '@/server/types';

export const registerRedeemInviteTool: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    'redeem_invite',
    {
      title: 'Redeem Invite',
      description: `Redeem an invite code for free USDC on Base. One-time use per code. Returns amount received and transaction hash. Use get_wallet_info after to verify balance.`,
      inputSchema: z.object({
        code: z.string().min(1).describe('The invite code'),
      }),
      outputSchema: z.object({
        redeemed: z.literal(true),
        amount: z.string().describe('Amount with unit (e.g., "5 USDC")'),
        txHash: z.string().describe('Transaction hash on Base'),
      }),
      annotations: {
        readOnlyHint: false, // Modifies wallet balance
        destructiveHint: false, // Additive (adds funds), not destructive
        idempotentHint: false, // Same code can't be redeemed twice - second attempt fails
        openWorldHint: true,
      },
    },
    async ({ code }) => {
      const result = await redeemInviteCode({
        code,
        dev: flags.dev,
        address,
        surface: 'redeem_invite',
      });

      if (result.isErr()) {
        return mcpError(result);
      }

      const { amount, txHash } = result.value;

      return mcpSuccessStructuredJson({
        redeemed: true,
        amount: `${amount} USDC`,
        txHash,
      });
    }
  );
};
