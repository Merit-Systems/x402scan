import chalk from 'chalk';
import { select, text, log, spinner } from '@clack/prompts';
import open from 'open';

import { DEFAULT_NETWORK, getChainName } from './networks';
import { wait } from './wait';

import type { GlobalFlags } from '@/types';

interface RedeemResponse {
  success: boolean;
  error?: string;
  amount?: string;
  txHash?: string;
}

export const getDepositLink = (address: string, flags: GlobalFlags) => {
  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';
  return `${baseUrl}/deposit/${address}`;
};

export const openDepositLink = async (address: string, flags: GlobalFlags) => {
  const depositLink = getDepositLink(address, flags);
  await open(depositLink);
};

const redeemInviteCodePrompt = async (
  address: string,
  flags: GlobalFlags
): Promise<boolean> => {
  const code = await text({
    message: 'Enter your invite code',
    placeholder: 'MRT-XXXXX',
    validate: value => {
      if (!value || value.trim().length === 0) {
        return 'Please enter an invite code';
      }
    },
  });

  if (typeof code !== 'string') {
    return false;
  }

  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';

  const s = spinner();
  s.start('Redeeming invite code...');

  try {
    const response = await fetch(`${baseUrl}/api/invite/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        recipientAddr: address,
      }),
    });

    const data = (await response.json()) as RedeemResponse;

    if (!data.success) {
      s.stop('Invite code redemption failed');
      log.warning(
        chalk.yellow(
          `Failed to redeem invite code: ${data.error ?? 'Unknown error'}`
        )
      );
      return false;
    }

    s.stop('Invite code redeemed successfully!');

    await wait({
      startText: 'Processing...',
      stopText: chalk.green(
        `${chalk.bold(data.amount)} USDC has been sent to your wallet!`
      ),
      ms: 1500,
    });

    log.success(
      chalk.bold(`Your wallet has been funded with ${data.amount} USDC`)
    );

    if (data.txHash) {
      log.info(
        chalk.dim(`Transaction: https://basescan.org/tx/${data.txHash}`)
      );
    }

    return true;
  } catch (error) {
    s.stop('Invite code redemption failed');
    log.warning(
      chalk.yellow(
        `Failed to redeem invite code: ${error instanceof Error ? error.message : 'Network error'}`
      )
    );
    return false;
  }
};

export const promptDeposit = async (address: string, flags: GlobalFlags) => {
  const depositLink = getDepositLink(address, flags);

  const depositChoice = await select({
    message: chalk.bold('How would you like to deposit?'),
    initialValue: 'guided' as string | undefined,
    options: [
      {
        label: 'Guided - Recommended',
        value: 'guided',
        hint: 'Online portal in x402scan',
      },
      {
        label: 'Manual',
        value: 'manual',
        hint: 'Print deposit instructions',
      },
      {
        label: 'Redeem invite code',
        value: 'invite',
        hint: 'Enter an invite code for starter money',
      },
      {
        label: 'Skip',
        value: undefined,
        hint: 'Skip deposit process - functionality limited',
      },
    ],
  });

  if (depositChoice === 'guided') {
    await wait({
      startText: 'Opening deposit page...',
      stopText: `Opening ${chalk.underline.hex('#2563eb')(depositLink)}`,
      ms: 1000,
    });

    await open(depositLink);
  } else if (depositChoice === 'manual') {
    log.step(chalk.bold('Account Information'));
    log.message(`Address: ${address}`);
    log.message(`Network: ${getChainName(DEFAULT_NETWORK)}`);
    log.step(chalk.bold('Online Portal'));
    log.message(`${chalk.underline(depositLink)}`);
  } else if (depositChoice === 'invite') {
    const redeemed = await redeemInviteCodePrompt(address, flags);
    if (!redeemed) {
      // If redemption failed, prompt again for deposit options
      await promptDeposit(address, flags);
    }
  }
};
