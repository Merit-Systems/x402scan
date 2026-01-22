import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

import { registerBalanceRouter } from './routes/balance.js';

const app = new Hono();

// Enable CORS for all origins (simple service endpoint)
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['*'],
    exposeHeaders: ['*'],
    credentials: true,
  })
);

app.get('/', c => {
  return c.json({
    service: 'rpc-proxy',
    version: '1.0.0',
    endpoints: {
      balance: '/balance/:address',
    },
  });
});

registerBalanceRouter(app);

const port = Number(process.env.PORT) || 6970;

serve({
  fetch: app.fetch,
  port,
});

