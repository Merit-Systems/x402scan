import { Hono } from 'hono';
import type { Context } from 'hono';

const REQUEST_HEADER_BLOCKLIST = new Set(['host', 'content-length']);

export function registerProxyRouter(app: Hono) {
    app.get('/api/proxy', async (c: Context) => {
        const startTime = Date.now();
        const queryUrl = c.req.searchParams.get('url');
        if (!queryUrl) {
            return c.json({ error: 'Missing url parameter' }, 400);
        }

        const url = decodeURIComponent(queryUrl);

        let targetUrl: URL;
        try {
            targetUrl = new URL(url);
        } catch {
            return c.json({ error: 'Invalid url parameter' }, 400);
        }

        const clonedRequest = c.req.clone();

        const upstreamHeaders = new Headers();
        c.req.headers.forEach((value, key) => {
            if (!REQUEST_HEADER_BLOCKLIST.has(key.toLowerCase())) {
                upstreamHeaders.set(key, value);
            }
        });

        const upstreamHeadersObj: Record<string, string> = {};
        upstreamHeaders.forEach((value, key) => {
            upstreamHeadersObj[key] = value;
        });

        const method = c.req.method.toUpperCase();
        let body: ArrayBuffer | undefined;
        let requestBodySize = 0;

        if (method !== 'GET' && method !== 'HEAD') {
            body = await c.req.arrayBuffer();
            requestBodySize = body.byteLength;
        }

        console.log('[Proxy Request]', {
            method,
            url: targetUrl.toString(),
            requestBodySize,
            timestamp: new Date().toISOString(),
          });

          
        const response = await fetch(url);
        return c.json(response);
    });
}