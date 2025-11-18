import { config } from 'dotenv';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { paymentMiddleware, type SolanaAddress } from 'x402-hono';
import { daydreams } from 'facilitators';

config();

const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;

if (!payTo) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const app = new Hono();

console.log('Server is running');

app.use(
  paymentMiddleware(
    payTo,
    {
      '/weather': {
        price: '$0.001',
        network: 'base-sepolia',
      },
    },
    daydreams
  )
);

app.get('/weather', c => {
  return c.json({
    report: {
      weather: 'sunny',
      temperature: 70,
    },
  });
});

serve({
  fetch: app.fetch,
  port: 4021,
});
