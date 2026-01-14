import open from 'open';

import { getUSDCBalance } from '@/lib/balance';
import { PrivateKeyAccount } from 'viem';

interface AddFundsFlags {
  account: PrivateKeyAccount;
  isNew: boolean;
  dev: boolean;
}

export const addFunds = async ({ account, isNew, dev }: AddFundsFlags) => {
  const baseUrl = dev ? 'http://localhost:3000' : 'https://x402scan.com';

  if (isNew) {
    console.log(
      'To use the MCP server, you will need USDC in your wallet to make paid API calls.'
    );
    // this should be confirmed by the user
    await open(`${baseUrl}/deposit/${account.address}`);
  } else {
    const balance = await getUSDCBalance({ address: account.address });
    if (balance.formatted < 0.5) {
      console.log('Your balance is low. Consider topping up.');
      // this should be confirmed by the user
      await open(`${baseUrl}/deposit/${account.address}`);
    }
  }
};
