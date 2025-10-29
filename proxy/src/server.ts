import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { registerProxyRouter } from './routes/proxy.js';
import { initClickHouseTable } from './db/clickhouse.js';

const app = new Hono();

// Enable CORS for all origins
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['*'],
  exposeHeaders: ['*'],
  credentials: true,
}));

registerProxyRouter(app);

const port = Number(process.env.PORT) || 6969;

// Initialize ClickHouse table on startup
initClickHouseTable()
  .catch((error) => {
    console.error('Failed to initialize ClickHouse, continuing without it:', error.message);
  });

serve({
  fetch: app.fetch,
  port,
});