import type { Command } from '@/types';

export const installMcpServer: Command = async wallet => {
  console.log('Welcome to the x402scan-mcp!');

  await Promise.resolve().then(() => {
    console.log('Installing x402scan-mcp...');
  });

  console.log(`Wallet address: ${wallet.address}`);
};
