import boxen from 'boxen';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import open from 'open';
import { DEFAULT_NETWORK, getChainName } from './networks';

export const promptDeposit = async (address: string, isDev?: boolean) => {
  const baseUrl = isDev ? 'http://localhost:3000' : 'https://x402scan.com';
  const depositLink = `${baseUrl}/deposit/${address}`;
  console.log(
    boxen(
      `${chalk.bold('Quick Deposit (recommended)')}\n${chalk.underline(depositLink)}\n\n${chalk.bold('Manual Deposit')}\nAddress: ${address}\nNetwork: ${getChainName(DEFAULT_NETWORK)}`,
      {
        borderStyle: 'round',
        borderColor: '#2563eb',
        title: chalk.bold('Deposit Details'),
        padding: 1,
      }
    )
  );
  console.log();
  const shouldOpen = await confirm({
    message: 'Would you like to visit the deposit page?',
    default: true,
  });
  if (shouldOpen) {
    await open(depositLink);
  }
};
