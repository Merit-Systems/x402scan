import { env } from '@/env';

import type { NextRequest } from 'next/server';

/**
 * CSRF guard for state-changing route handlers: the request's Origin (or Referer
 * fallback) host must match the app's own host. Pairs with SameSite=Lax cookies.
 * Requests with no Origin/Referer are rejected, as browsers always send Origin
 * on cross-site POSTs.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const source =
    request.headers.get('origin') ?? request.headers.get('referer');
  if (!source) {
    return false;
  }
  try {
    const sourceHost = new URL(source).host;
    const appHost = new URL(env.NEXT_PUBLIC_APP_URL).host;
    return sourceHost === appHost || sourceHost === request.nextUrl.host;
  } catch {
    return false;
  }
}
