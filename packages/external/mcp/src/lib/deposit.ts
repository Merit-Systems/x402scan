import chalk from 'chalk';
import { select, log } from '@clack/prompts';
import open from 'open';

import { DEFAULT_NETWORK, getChainName } from './networks';
import { wait } from './wait';

import type { GlobalFlags } from '@/types';

export const getDepositLink = (address: string, flags: GlobalFlags) => {
  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';
  return `${baseUrl}/deposit/${address}`;
};

export const openDepositLink = async (address: string, flags: GlobalFlags) => {
  const depositLink = getDepositLink(address, flags);
  await open(depositLink);
};

export const promptDeposit = async (address: string, flags: GlobalFlags) => {
  const depositLink = getDepositLink(address, flags);

  const guidedDeposit = await select({
    message: chalk.bold('How would you like to deposit?'),
    initialValue: true,
    options: [
      {
        label: `Guided - Recommended`,
        value: true,
        hint: 'Online portal in x402scan',
      },
      {
        label: 'Manual',
        value: false,
        hint: 'Print deposit instructions',
      },
      {
        label: 'Skip',
        value: undefined,
        hint: 'Skip deposit process - functionality limited',
      },
    ],
  });

  if (guidedDeposit === true) {
    await wait({
      startText: 'Opening deposit page...',
      stopText: `Opening ${chalk.underline.hex('#2563eb')(depositLink)}`,
      ms: 1000,
    });

    await open(depositLink);
  } else if (guidedDeposit === false) {
    log.step(chalk.bold('Account Information'));
    log.message(`Address: ${address}`);
    log.message(`Network: ${getChainName(DEFAULT_NETWORK)}`);
    log.step(chalk.bold('Online Portal'));
    log.message(`${chalk.underline(depositLink)}`);
  }
};
