import { z } from 'zod';

import { getWalletInfo } from '@/shared/operations';
import { mcpSuccessStructuredJson, mcpError } from './response';

import type { RegisterTools } from '@/server/types';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    'get_wallet_info',
    {
      title: 'Get Wallet Info',
      description: `Get wallet address and USDC balance on Base. Auto-creates wallet on first use (~/.x402scan-mcp/wallet.json). Returns deposit link. Check before first paid API call.`,
      outputSchema: z.object({
        address: z.string().describe('Wallet address (0x...)'),
        network: z.string().describe('CAIP-2 network ID (e.g., eip155:8453)'),
        networkName: z.string().describe('Human-readable network name'),
        usdcBalance: z.number().describe('USDC balance'),
        isNewWallet: z.boolean().describe('True if balance is 0'),
        depositLink: z.string().url().describe('Link to fund the wallet'),
        message: z.string().optional().describe('Warning if balance is low'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      const result = await getWalletInfo('get_wallet_info', address, flags);

      if (result.isErr()) {
        return mcpError(result);
      }

      return mcpSuccessStructuredJson({
        address: result.value.address,
        network: result.value.network,
        networkName: result.value.networkName,
        usdcBalance: result.value.usdcBalance,
        isNewWallet: result.value.isNewWallet,
        depositLink: result.value.depositLink,
        ...(result.value.message ? { message: result.value.message } : {}),
      });
    }
  );
};
