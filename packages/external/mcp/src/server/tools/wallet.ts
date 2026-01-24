import { mcpSuccess } from '@/server/lib/response';

import { getUSDCBalance } from '@/lib/balance';
import { DEFAULT_NETWORK, getChainName } from '@/lib/networks';

import type { RegisterTools } from '@/server/types';
import { getDepositLink } from '@/lib/deposit';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    'check_balance',
    {
      description:
        'Check wallet address and USDC balance. Creates wallet if needed.',
    },
    async () => {
      const { balanceFormatted } = await getUSDCBalance(address, flags);

      return mcpSuccess({
        address,
        network: DEFAULT_NETWORK,
        networkName: getChainName(DEFAULT_NETWORK),
        usdcBalance: balanceFormatted,
        balanceFormatted: balanceFormatted.toString(),
        isNewWallet: balanceFormatted === 0,
        depositLink: getDepositLink(address, flags),
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
