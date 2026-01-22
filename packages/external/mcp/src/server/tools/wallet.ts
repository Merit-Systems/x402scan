import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';

import { mcpSuccessJson, mcpErrorJson } from './response';

import type { RegisterTools } from '@/server/types';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
}) => {
  server.registerTool(
    'get_wallet_info',
    {
      description:
        'Check wallet address and USDC balance. Creates wallet if needed.',
    },
    async () => {
      const balanceResult = await getBalance(address);

      if (balanceResult.isErr()) {
        return mcpErrorJson(balanceResult.error);
      }

      const balance = balanceResult.value;

      return mcpSuccessJson({
        address,
        network: DEFAULT_NETWORK,
        networkName: getChainName(DEFAULT_NETWORK),
        usdcBalance: balance,
      });
    }
  );
};
