import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { registerProxyRouter } from './routes/proxy';

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

serve({
  fetch: app.fetch,
  port,
});