import 'server-only';

import { cdpClient } from './client';

interface ServerAccount {
  address: string;
  name?: string;
}

export const listAllServerAccounts = async (): Promise<ServerAccount[]> => {
  const allAccounts: ServerAccount[] = [];
  let response = await cdpClient.evm.listAccounts();

  while (true) {
    for (const account of response.accounts) {
      allAccounts.push({
        address: account.address,
        name: account.name,
      });
    }

    if (!response.nextPageToken) break;

    response = await cdpClient.evm.listAccounts({
      pageToken: response.nextPageToken,
    });
  }

  return allAccounts;
};

export const generateAccountsCsv = (accounts: ServerAccount[]): string => {
  const header = 'name,address\n';
  const rows = accounts
    .map(account => `${account.name ?? ''},${account.address}`)
    .join('\n');
  return header + rows;
};
