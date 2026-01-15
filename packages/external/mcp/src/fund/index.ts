import open from 'open';

import type { Command } from '@/types';

export const fundMcpServer: Command = async (wallet, args) => {
  const baseUrl = args.dev ? 'http://localhost:3000' : 'https://x402scan.com';
  const url = `${baseUrl}/deposit/${wallet.address}`;
  await open(url);
};
