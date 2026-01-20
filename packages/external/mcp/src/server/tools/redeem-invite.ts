import z from 'zod';
import { mcpSuccess, mcpError } from '@/server/lib/response';

import type { RegisterTools } from '@/server/types';

export const registerRedeemInviteTool: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';

  server.registerTool(
    'redeem_invite',
    {
      description: 'Redeem an invite code to receive USDC.',
      inputSchema: z.object({
        code: z.string().min(1).describe('The invite code'),
      }),
    },
    async ({ code }) => {
      const res = await fetch(`${baseUrl}/api/invite/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, recipientAddr: address }),
      });

      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        amount?: string;
        txHash?: string;
      };

      if (!data.success) {
        return mcpError(data.error ?? 'Failed to redeem invite code');
      }

      return mcpSuccess({
        amount: `${data.amount} USDC`,
        txHash: data.txHash,
      });
    }
  );
};
