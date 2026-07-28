import { env } from '@/env';

import {
  CLAIM_COOKIE_NAME,
  CLAIM_COOKIE_NAME_PROD,
  CLAIM_SESSION_TTL_MS,
} from './constants';

const isProd = env.NEXT_PUBLIC_NODE_ENV === 'production';

/** Cookie name — `__Host-` prefixed in prod (requires Secure + Path=/, https-only). */
export function claimCookieName(): string {
  return isProd ? CLAIM_COOKIE_NAME_PROD : CLAIM_COOKIE_NAME;
}

/** Options for a freshly-minted claim-session cookie. */
export function claimCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(CLAIM_SESSION_TTL_MS / 1000),
  };
}

/**
 * Options for deleting the claim cookie. Must keep Secure + Path=/ in prod, or
 * the browser rejects the deletion Set-Cookie for the `__Host-` prefixed name
 * and the cookie survives sign-out.
 */
export function claimCookieClearOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

/** Read the claim-session token from a request's Cookie header (either cookie name). */
export function readClaimToken(headers: Headers): string | null {
  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const name = part.slice(0, eq).trim();
    if (name === CLAIM_COOKIE_NAME || name === CLAIM_COOKIE_NAME_PROD) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}
