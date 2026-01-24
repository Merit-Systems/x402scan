import { mcpSuccess } from '@/server/lib/response';

import { getUSDCBalance } from '@/lib/balance';
import { DEFAULT_NETWORK, getChainName } from '@/lib/networks';
import { getBaseUrl } from '@/lib/utils';
import { log } from '@/lib/log';

import type { RegisterTools } from '@/server/types';
import { getDepositLink } from '@/lib/deposit';

export const registerWalletTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  const baseUrl = getBaseUrl(flags.dev);

  server.registerTool(
    'check_balance',
    {
      description:
        'Check wallet address and USDC balance. Creates wallet if needed.',
    },
    async () => {
      const { balanceFormatted } = await getUSDCBalance(address, flags);

      // Log balance check telemetry (fire and forget)
      fetch(`${baseUrl}/api/telemetry/balance-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, chain: DEFAULT_NETWORK }),
      }).catch((err: unknown) =>
        log.debug('Failed to log balance check', { error: err })
      );

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
