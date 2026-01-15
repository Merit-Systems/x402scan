import { getUSDCBalance } from '@/lib/balance';
import { openDepositLink } from '@/lib/deposit';

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
  const balance = await getUSDCBalance({
    address,
  });

  if (balance < amountNeeded) {
    const result = await server.server.elicitInput({
      mode: 'form',
      message: message(balance),
      requestedSchema: {
        type: 'object',
        properties: {},
      },
    });

    if (result.action === 'accept') {
      await openDepositLink(address, flags);
    }
  }
};
