import chalk from 'chalk';
import { intro, outro } from '@clack/prompts';

import { getWallet } from '@/shared/wallet';
import { log } from '@/shared/log';

import { getClient } from './1-get-client';
import { addServer } from './2-add-server';
import { redeemInviteCode } from './3-redeem-invite';
import { addFunds } from './4-add-funds';

import type { Command, GlobalFlags } from '@/types';

export type InstallFlags = GlobalFlags<{
  client?: string;
}>;

export const installMcpServer: Command<InstallFlags> = async flags => {
  intro(chalk.green.bold(`Install x402scan MCP`));

  const walletResult = await getWallet();

  if (walletResult.isErr()) {
    log.error(JSON.stringify(walletResult.error, null, 2));
    outro(chalk.bold.red('Failed to get wallet'));
    process.exit(1);
  }

  const {
    account: { address },
    isNew,
  } = walletResult.value;

  const client = await getClient(flags);

  await addServer(client, flags);

  const inviteRedeemed = flags.invite
    ? await redeemInviteCode(
        {
          code: flags.invite,
          dev: flags.dev,
          address,
          surface: 'install',
        },
        flags
      )
    : false;

  if (!inviteRedeemed) {
    await addFunds({ flags, address, isNew });
  }

  outro(chalk.bold.green('Your x402scan MCP server is ready to use!'));
};
