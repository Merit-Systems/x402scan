import { getWallet } from '@/lib/wallet';
import { getClient } from './1-get-client';
import { addServer } from './2-add-server';
import { redeemInviteCode } from './3-redeem-invite';
import { addFunds } from './4-add-funds';

import type { Command, GlobalFlags } from '@/types';
import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';

export type InstallFlags = GlobalFlags<{
  client?: string;
}>;

export const installMcpServer: Command<InstallFlags> = async flags => {
  const {
    account: { address },
    isNew,
  } = await getWallet();

  intro(chalk.green.bold(`Install x402scan MCP`));

  const client = await getClient(flags);

  await addServer(client, flags);

  const inviteRedeemed = flags.invite
    ? await redeemInviteCode({
        code: flags.invite,
        dev: flags.dev,
        address,
      })
    : false;

  if (!inviteRedeemed) {
    await addFunds({ flags, address, isNew });
  }

  outro(chalk.bold.green('Your x402scan MCP server is ready to use!'));
};
