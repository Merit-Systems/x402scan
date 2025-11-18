import { toAccount } from 'viem/accounts';
import { wrapFetchWithPayment } from 'x402-fetch';
import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize CDP client
  const cdp = new CdpClient();

  const walletClientOwner = process.env.WALLET_CLIENT_OWNER as `0x${string}`;

  const owner = await cdp.evm.getOrCreateAccount({
    name: walletClientOwner,
  });

  console.log('Owner:', owner.address);

  const account = toAccount(owner);

  // Wrap the fetch function with payment handling
  const fetchWithPay = wrapFetchWithPayment(fetch, account);

  // Make 10 parallel requests
  const requests = Array.from({ length: 50 }, () =>
    fetchWithPay('http://localhost:3019/protected-route', {
      method: 'GET',
    }).then(async response => {
      const data = (await response.json()) as unknown;
      console.log('Response data:', data);
      return data;
    })
  );

  await Promise.all(requests);
}

// Run the main function
main().catch(console.error);
