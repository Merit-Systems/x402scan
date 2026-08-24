import { apiError } from '@/lib/agent/api-errors';
import { API_VERSION, API_VERSION_HEADER, SITE_URL } from '@/lib/site';

import type { NextRequest } from 'next/server';

/**
 * JSON 404 for every `/api/*` path that has no route handler. Without this,
 * Next.js answers unknown API paths with the HTML not-found page, which agents
 * can't parse. Static routes always win over this catch-all, so it never
 * shadows a real endpoint.
 */
function notFound(req: NextRequest) {
  const { pathname } = new URL(req.url);
  return apiError(
    404,
    {
      type: 'not_found',
      message: `No API route matches ${req.method} ${pathname}.`,
      hint: 'Check the OpenAPI spec for the list of operations and their exact paths. Public data endpoints live under /api/x402.',
      links: {
        openapi: `${SITE_URL}/openapi.json`,
        docs: `${SITE_URL}/docs`,
        catalog: `${SITE_URL}/.well-known/api-catalog`,
        llms: `${SITE_URL}/llms.txt`,
      },
    },
    {
      [API_VERSION_HEADER]: API_VERSION,
      'Access-Control-Allow-Origin': '*',
    }
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
