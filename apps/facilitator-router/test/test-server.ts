import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { paymentMiddleware } from 'x402-express';
import { toAccount } from 'viem/accounts';
import { CdpClient } from '@coinbase/cdp-sdk';

const app = express();

const walletServerOwner = process.env
  .TEST_SERVER_OWNER_ADDRESS as `0x${string}`;

const cdp = new CdpClient();

const owner = await cdp.evm.getOrCreateAccount({
  name: walletServerOwner,
});

const account = toAccount(owner);

// Configure the payment middleware
app.use(
  paymentMiddleware(
    account.address,
    {
      '/protected-route': {
        price: '$0.01',
        network: 'base',
        config: {
          description: 'Access to premium content',
        },
      },
    },
    {
      url: 'http://localhost:3099',
    }
  )
);

// Implement your route
app.get('/protected-route', (req, res) => {
  res.json({ message: 'This content is behind a paywall' });
});

app.listen(3019, () => {
  console.log('Test server is running on port 3019');
});
