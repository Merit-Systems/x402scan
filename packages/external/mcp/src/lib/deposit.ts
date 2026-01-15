import boxen from 'boxen';
import chalk from 'chalk';
import { select, log } from '@clack/prompts';
import open from 'open';

import { DEFAULT_NETWORK, getChainName } from './networks';
import { wait } from './wait';

import type { GlobalFlags } from '@/types';

const getDepositLink = (address: string, flags: GlobalFlags) => {
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
    log.message(
      boxen(
        `${chalk.bold('Account Information')}\nAddress: ${address}\nNetwork: ${getChainName(DEFAULT_NETWORK)}\n\n${chalk.bold('Online Portal')}\n${chalk.underline(depositLink)}`,
        {
          borderStyle: 'round',
          borderColor: '#2563eb',
          title: 'Deposit Instructions',
          padding: 1,
        }
      )
    );
  } else {
    log.message('Skipping deposit process...');
  }
};
