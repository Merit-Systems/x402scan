import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { registerProxyRouter } from './routes/proxy';


const app = new Hono();

registerProxyRouter(app);

const port = Number(process.env.PORT) || 6969;

serve({
    fetch: app.fetch,
    port,
});