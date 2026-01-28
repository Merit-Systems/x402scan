import z from 'zod';
import { mcpError, mcpSuccessJson } from './response';

import { redeemInviteCode } from '@/shared/redeem-invite';

import type { RegisterTools } from '@/server/types';

const toolName = 'redeem_invite';

export const registerRedeemInviteTool: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Redeem Invite',
      description: 'Redeem an invite code to receive USDC.',
      inputSchema: z.object({
        code: z.string().min(1).describe('The invite code'),
      }),
    },
    async ({ code }) => {
      const result = await redeemInviteCode({
        code,
        dev: flags.dev,
        address,
        surface: toolName,
      });

      if (result.isErr()) {
        return mcpError(result);
      }

      const { amount, txHash } = result.value;

      return mcpSuccessJson({
        redeemed: true,
        amount: `${amount} USDC`,
        txHash,
      });
    }
  );
};
