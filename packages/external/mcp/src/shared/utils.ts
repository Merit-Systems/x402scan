import open from 'open';

import type { GlobalFlags } from '@/types';

export const getBaseUrl = (dev: boolean) => {
  return dev ? 'http://localhost:3000' : 'https://x402scan.com';
};

export const getDepositLink = (address: string, flags: GlobalFlags) => {
  return `${getBaseUrl(flags.dev)}/deposit/${address}`;
};

export const openDepositLink = async (address: string, flags: GlobalFlags) => {
  const depositLink = getDepositLink(address, flags);
  await open(depositLink);
};
