import z from 'zod';
import { mcpSuccess, mcpError } from '@/server/lib/response';

import type { RegisterTools } from '@/server/types';

interface RedeemResponse {
  success: boolean;
  error?: string;
  amount?: string;
  txHash?: string;
}

interface ValidateResponse {
  valid: boolean;
  error?: string;
}

const inviteCodeSchema = z.object({
  code: z.string().min(1).describe('The invite code to redeem or validate'),
});

export const registerRedeemInviteTool: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';

  server.registerTool(
    'redeem_invite',
    {
      description:
        'Redeem an invite code to receive USDC in your wallet. Use this when you have an invite code to claim free USDC.',
      inputSchema: inviteCodeSchema,
    },
    async ({ code }: z.infer<typeof inviteCodeSchema>) => {
      try {
        const response = await fetch(`${baseUrl}/api/invite/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            recipientAddr: address,
          }),
        });

        const data = (await response.json()) as RedeemResponse;

        if (!data.success) {
          return mcpError(data.error ?? 'Failed to redeem invite code');
        }

        return mcpSuccess({
          success: true,
          message: `Successfully redeemed invite code "${code}"!`,
          amount: `${data.amount ?? '0'} USDC`,
          txHash: data.txHash,
          recipientAddress: address,
        });
      } catch (error) {
        return mcpError(error, { code, recipientAddress: address });
      }
    }
  );

  server.registerTool(
    'validate_invite',
    {
      description:
        'Check if an invite code is valid before redeeming it. Use this to verify a code is valid without redeeming it.',
      inputSchema: inviteCodeSchema,
    },
    async ({ code }: z.infer<typeof inviteCodeSchema>) => {
      try {
        const response = await fetch(
          `${baseUrl}/api/invite/redeem?code=${encodeURIComponent(code)}&recipientAddr=${encodeURIComponent(address)}`,
          {
            method: 'GET',
          }
        );

        const data = (await response.json()) as ValidateResponse;

        if (!data.valid) {
          return mcpSuccess({
            valid: false,
            reason: data.error ?? 'Invalid invite code',
          });
        }

        return mcpSuccess({
          valid: true,
          message: 'Invite code is valid and can be redeemed',
        });
      } catch (error) {
        return mcpError(error, { code });
      }
    }
  );
};
