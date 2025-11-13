import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { registerProxyRouter } from './routes/proxy.js';
import { createResourceInvocationsTable } from '@x402scan/analytics-db';

const app = new Hono();

// Enable CORS for all origins
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['*'],
    exposeHeaders: ['*'],
    credentials: true,
  })
);

app.get('/', c => {
  return c.json({
    service: 'x402 Proxy Server',
    description: 'CORS-enabled proxy service for x402 resource invocations',
    version: '1.0.0',
    endpoints: {
      proxy: '/api/proxy?url=<encoded-url>&share_data=<boolean>',
    },
    usage: {
      description: 'Proxy requests to external URLs with CORS support',
      example: '/api/proxy?url=https%3A%2F%2Fexample.com%2Fapi',
      parameters: {
        url: 'Required. The URL to proxy the request to (URL-encoded)',
        share_data:
          'Optional. Set to "true" to include request/response headers and body in logs',
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    links: {
      website: 'https://x402scan.com',
    },
  });
});

registerProxyRouter(app);

const port = Number(process.env.PORT) || 6969;

// Initialize ClickHouse table on startup
void createResourceInvocationsTable().catch(error => {
  console.error(
    'Failed to initialize ClickHouse, continuing without it:',
    error instanceof Error ? error.message : String(error)
  );
});

serve({
  fetch: app.fetch,
  port,
});