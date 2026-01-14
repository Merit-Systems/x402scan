import open from 'open';

import { getUSDCBalance } from '@/lib/balance';

import type { Command } from '@/types';

interface InstallFlags {
  client: string;
  isNew: boolean;
}

export const installMcpServer: Command<InstallFlags> = async (
  wallet,
  flags
) => {
  const { isNew, client, dev } = flags;

  const baseUrl = dev ? 'http://localhost:3000' : 'https://x402scan.com';

  if (flags.isNew) {
    console.log('Welcome to the x402scan-mcp!');
    console.log("You're new here, so we've created a new wallet for you.");
  } else {
    console.log('Welcome back to the x402scan MCP server!');
  }

  console.log(
    `All of the necessary configuration has been added to ${client}!`
  );

  if (isNew) {
    console.log(
      'To use the MCP server, you will need USDC in your wallet to make paid API calls.'
    );
    // this should be confirmed by the user
    await open(`${baseUrl}/deposit/${wallet.address}`);
  } else {
    const balance = await getUSDCBalance({ address: wallet.address });
    if (balance.formatted < 0.5) {
      console.log('Your balance is low. Consider topping up.');
      // this should be confirmed by the user
      await open(`${baseUrl}/deposit/${wallet.address}`);
    }
  }
};
