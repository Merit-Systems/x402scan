import { getUSDCBalance } from '@/lib/balance';
import { getDepositLink, openDepositLink } from '@/lib/deposit';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Address } from 'viem';
import type { GlobalFlags } from '@/types';

interface CheckBalanceProps {
  server: McpServer;
  address: Address;
  amountNeeded: number;
  message: (balance: number) => string;
  flags: GlobalFlags;
}

export const checkBalance = async ({
  server,
  address,
  amountNeeded,
  message,
  flags,
}: CheckBalanceProps) => {
  const { balanceFormatted } = await getUSDCBalance(address, flags);

  if (balanceFormatted < amountNeeded) {
    const capabilities = server.server.getClientCapabilities();
    if (!capabilities?.elicitation) {
      throw new Error(
        `${message(balanceFormatted)}\n\nYou can deposit USDC at ${getDepositLink(address, flags)}`
      );
    }

    const result = await server.server.elicitInput({
      mode: 'form',
      message: message(balanceFormatted),
      requestedSchema: {
        type: 'object',
        properties: {},
      },
    });

    if (result.action === 'accept') {
      await openDepositLink(address, flags);
    }
  }

  return balanceFormatted;
};
