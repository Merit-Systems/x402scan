import { getBalance } from '@/shared/balance';
import { getDepositLink, openDepositLink } from '@/shared/utils';
import { log } from '@/shared/log';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Address } from 'viem';
import type { GlobalFlags } from '@/types';

interface CheckBalanceProps {
  server: McpServer;
  address: Address;
  amountNeeded: number;
  message: (balance: number) => string;
  flags: GlobalFlags;
  surface: string;
}

export const checkBalance = async ({
  server,
  address,
  amountNeeded,
  message,
  flags,
  surface,
}: CheckBalanceProps) => {
  const balanceResult = await getBalance({ address, flags, surface });

  if (balanceResult.isErr()) {
    log.error(JSON.stringify(balanceResult.error, null, 2));
    return;
  }

  const balance = balanceResult.value;

  if (balance.balance < amountNeeded) {
    const capabilities = server.server.getClientCapabilities();
    if (!capabilities?.elicitation) {
      throw new Error(
        `${message(balance.balance)}\n\nYou can deposit USDC at ${getDepositLink(address, flags)}`
      );
    }

    const result = await server.server.elicitInput({
      mode: 'form',
      message: message(balance.balance),
      requestedSchema: {
        type: 'object',
        properties: {},
      },
    });

    if (result.action === 'accept') {
      await openDepositLink(address, flags);
    }
  }

  return balance.balance;
};
