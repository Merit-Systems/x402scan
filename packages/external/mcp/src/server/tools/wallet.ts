import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';
import { getDepositLink } from '@/shared/utils';

import { mcpSuccessJson, mcpError } from './response';

import type { RegisterTools } from '@/server/types';

const toolName = 'get_wallet_info';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Get Wallet Info',
      description: `Get wallet address and USDC balance on Base. Auto-creates wallet on first use (~/.x402scan-mcp/wallet.json). Returns deposit link. Check before paid API calls.`,
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
        surface: toolName,
      });

      if (balanceResult.isErr()) {
        return mcpError(balanceResult);
      }

      const { balance } = balanceResult.value;

      return mcpSuccessJson({
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
