import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';

import { mcpSuccessJson, mcpError } from './response';

import type { RegisterTools } from '@/server/types';
import { getDepositLink } from '@/shared/utils';

const toolName = 'getWalletInfo';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    toolName,
    {
      description:
        'Check wallet address and USDC balance. Creates wallet if needed.',
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
        ...(balance < 1
          ? {
              message: `Your balance is low. You can top up at ${getDepositLink(address, flags)}`,
            }
          : {}),
      });
    }
  );
};
