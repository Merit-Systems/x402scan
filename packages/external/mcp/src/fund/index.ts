import { Command } from '@/types';
import open from 'open';

export const fundMcpServer: Command = async (wallet, args) => {
  const baseUrl = args.dev ? 'http://localhost:3000' : 'https://x402scan.com';
  console.log(`${baseUrl}/deposit/${wallet.address}`);
  const url = `${baseUrl}/deposit/${wallet.address}`;
  await open(url);
};
