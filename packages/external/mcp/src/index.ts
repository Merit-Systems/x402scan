#!/usr/bin/env node

import { getWallet } from './lib/wallet';

const args = process.argv.slice(2);
const command = args[0];

const run = async (command: string | undefined) => {
  const account = await getWallet();

  if (command === undefined) {
    void import('@/server').then(({ startServer }) => startServer(account));
  } else if (command === 'install') {
    void import('@/install').then(({ installMcpServer }) =>
      installMcpServer(account)
    );
  } else if (command === 'fund') {
    void import('@/fund').then(({ fundMcpServer }) => fundMcpServer(account));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
};

void run(command).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
