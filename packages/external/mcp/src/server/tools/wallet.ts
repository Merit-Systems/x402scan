import { mcpError, mcpSuccess } from '@/server/lib/response';

import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';

import type { RegisterTools } from '@/server/types';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
}) => {
  server.registerTool(
    'check_balance',
    {
      description:
        'Check wallet address and USDC balance. Creates wallet if needed.',
    },
    async () => {
      const balanceResult = await getBalance(address);

      if (balanceResult.isErr()) {
        return mcpError(balanceResult.error.message);
      }

      const balance = balanceResult.value;

      return mcpSuccess({
        address,
        network: DEFAULT_NETWORK,
        networkName: getChainName(DEFAULT_NETWORK),
        usdcBalance: balance,
        balanceFormatted: balance.toString(),
        isNewWallet: balance === 0,
      });
    }
  );

  server.registerTool(
    'get_wallet_address',
    {
      description: 'Get the wallet address.',
    },
    () => mcpSuccess({ address })
  );
};
