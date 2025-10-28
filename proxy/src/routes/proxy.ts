import { Hono } from 'hono';


export function registerProxyRouter(app: Hono) {
    app.get('/api/proxy', async (c) => {
        const url = c.req.query('url');
        if (!url) {
            return c.json({ error: 'Missing url parameter' }, 400);
        }
        const response = await fetch(url);
        return c.json(response);
    });
}