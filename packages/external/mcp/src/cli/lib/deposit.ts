import chalk from 'chalk';
import { select, text, log, spinner } from '@clack/prompts';
import open from 'open';

import { DEFAULT_NETWORK, getChainName } from '../../shared/networks';
import { wait } from './wait';
import { getDepositLink } from '../../shared/utils';
import { redeemInviteCode } from '../../shared/redeem-invite';

import type { GlobalFlags } from '@/types';
import type { Address } from 'viem';

interface PromptDepositProps {
  address: Address;
  flags: GlobalFlags;
  surface: string;
}

export const promptDeposit = async (
  props: PromptDepositProps
): Promise<void> => {
  const { address, flags, surface } = props;

  const depositLink = getDepositLink(address, flags);

  const depositChoice =
    flags.yes || surface === 'guided'
      ? 'manual'
      : await select({
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
              label: 'Redeem Invite Code',
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
      return promptDeposit({ address, flags, surface });
    }

    const s = spinner();
    s.start('Redeeming invite code...');

    const redeemResult = await redeemInviteCode({
      code,
      dev: flags.dev,
      address,
      surface: 'redeemInvite',
    });

    if (redeemResult.isErr()) {
      s.stop('Invite code redemption failed');
      log.error('Failed to redeem invite code');
      return promptDeposit({ address, flags, surface });
    }

    s.stop('Invite code redeemed successfully!');

    const { amount, txHash } = redeemResult.value;

    await wait({
      startText: 'Processing...',
      stopText: chalk.green(
        `${chalk.bold(amount)} USDC has been sent to your wallet!`
      ),
      ms: 1500,
    });

    log.success(chalk.bold(`Your wallet has been funded with ${amount} USDC`));

    if (txHash) {
      log.info(chalk.dim(`Transaction: https://basescan.org/tx/${txHash}`));
    }

    return;
  }
};
