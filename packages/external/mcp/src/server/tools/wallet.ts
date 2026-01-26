import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';
import { getDepositLink } from '@/shared/utils';

import { mcpSuccessJson, mcpError } from './response';

import type { RegisterTools } from '@/server/types';

const toolName = 'getWalletInfo';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Get Wallet Info',
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
