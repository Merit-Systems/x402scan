import { z } from 'zod';

import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';
import { getDepositLink } from '@/shared/utils';

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
      const balanceResult = await getBalance({
        address,
        flags,
        surface: 'get_wallet_info',
      });

      if (balanceResult.isErr()) {
        return mcpError(balanceResult);
      }

      const { balance } = balanceResult.value;

      return mcpSuccessStructuredJson({
        address,
        network: DEFAULT_NETWORK,
        networkName: getChainName(DEFAULT_NETWORK),
        usdcBalance: balance,
        isNewWallet: balance === 0,
        depositLink: getDepositLink(address, flags),
        ...(balance < 2.5
          ? {
              message: `Your balance is low. Consider topping it up`,
            }
          : {}),
      });
    }
  );
};
