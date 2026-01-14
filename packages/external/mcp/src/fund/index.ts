import { BASE_URL } from '@/lib/constants';
import { Command } from '@/types';
import open from 'open';

export const fundMcpServer: Command = async wallet => {
  console.log(`${BASE_URL}/deposit/${wallet.address}`);
  const url = `${BASE_URL}/deposit/${wallet.address}`;
  await open(url);
};
