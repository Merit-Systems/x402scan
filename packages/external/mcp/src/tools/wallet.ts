/**
 * Wallet tools - balance checking
 */

import { mcpSuccess, mcpError } from '../response';
import { getUSDCBalance } from '../lib/balance';
import {
  DEFAULT_NETWORK,
  getChainName,
  getExplorerUrl,
  getUSDCAddress,
  isTestnet,
} from '../lib/networks';

import type { RegisterTools } from './types';

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
      try {
        try {
          const balance = await getUSDCBalance({
            address,
          });
          return mcpSuccess({
            address,
            network: balance.network,
            networkName: getChainName(balance.network),
            balanceUSDC: balance.formatted,
            balanceFormatted: balance.formattedString,
            isNewWallet: balance.formatted === 0,
            ...(balance.formatted < 1
              ? {
                  fundingInstructions: getFundingInstructions(
                    address,
                    balance.network
                  ),
                  suggestion:
                    balance.formatted === 0
                      ? 'Your wallet has no USDC. Send USDC to the address above to start making paid API calls.'
                      : 'Your balance is low. Consider topping up.',
                }
              : {}),
          });
        } catch (err) {
          return mcpSuccess({
            address,
            network: DEFAULT_NETWORK,
            networkName: getChainName(DEFAULT_NETWORK),
            balanceUSDC: null,
            balanceError:
              err instanceof Error ? err.message : 'Failed to fetch balance',
            isNewWallet: false,
            fundingInstructions: getFundingInstructions(
              address,
              DEFAULT_NETWORK
            ),
          });
        }
      } catch (err) {
        return mcpError(err, { tool: 'check_balance' });
      }
    }
  );
};

function getFundingInstructions(
  address: string,
  network = DEFAULT_NETWORK
): Record<string, unknown> {
  const explorerUrl = getExplorerUrl(network);
  const usdcAddress = getUSDCAddress(network);
  const chainName = getChainName(network);
  const testnet = isTestnet(network);

  return {
    chainName,
    isTestnet: testnet,
    depositAddress: address,
    usdcContract: usdcAddress,
    explorerUrl: explorerUrl ? `${explorerUrl}/address/${address}` : undefined,
    instructions: testnet
      ? `This is a testnet. Get test USDC from a faucet and send to ${address}`
      : `Send USDC on ${chainName} to ${address}`,
  };
}
