import z from 'zod';
import { mcpErrorFetch, mcpErrorJson, mcpSuccessJson } from './response';

import { redeemInviteCode } from '@/shared/redeem-invite';

import type { RegisterTools } from '@/server/types';
import { isFetchError } from '@/shared/neverthrow/fetch';

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
        if (isFetchError(result.error)) {
          return await mcpErrorFetch(result.error);
        }
        return mcpErrorJson(result.error);
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
