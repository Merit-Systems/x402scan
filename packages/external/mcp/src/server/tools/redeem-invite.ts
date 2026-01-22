import z from 'zod';
import { mcpError, mcpTextSuccess } from './lib/result';

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
      description: 'Redeem an invite code to receive USDC.',
      inputSchema: z.object({
        code: z.string().min(1).describe('The invite code'),
      }),
    },
    async ({ code }) => {
      const result = await redeemInviteCode({ code, dev: flags.dev, address });

      if (result.isErr()) {
        return mcpError(result.error);
      }

      const { amount, txHash } = result.value;

      return mcpTextSuccess({
        amount: `${amount} USDC`,
        txHash,
      });
    }
  );
};
