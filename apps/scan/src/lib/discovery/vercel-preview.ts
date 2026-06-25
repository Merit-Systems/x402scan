const VERCEL_APP_SUFFIX = '.vercel.app';
const PREVIEW_CHECK_TIMEOUT_MS = 8000;
/** Two attempts: a sleeping preview can cold-start past the first timeout; the
 *  first request wakes it so the second reads the edge-injected header. */
const PREVIEW_CHECK_ATTEMPTS = 2;

/**
 * Error shown when an origin is rejected as a Vercel preview deployment.
 * Mirrors the tone of the ephemeral-tunnel rejection in `register-endpoint.ts`.
 */
export const VERCEL_PREVIEW_ERROR_MESSAGE =
  'Vercel preview deployments are ephemeral and get torn down, so agents ' +
  "can't reliably reach them. Deploy to production and register that URL instead.";

/** True when the URL is hosted on a `*.vercel.app` subdomain. Pure, no I/O. */
export function isVercelHost(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith(VERCEL_APP_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * True when the URL is a Vercel **preview / non-production** deployment.
 *
 * Vercel injects `x-robots-tag: noindex` at the edge on every deployment URL
 * except the production target, so a `*.vercel.app` host that serves `noindex`
 * is a preview/branch/deployment-scoped URL — ephemeral and unsafe to register.
 * Clean production aliases (`<project>.vercel.app`) and custom domains never
 * carry the header (verified across 19 live production aliases).
 *
 * Fails open: non-`*.vercel.app` hosts never touch the network, and any probe
 * error returns false — only a confirmed `noindex` blocks registration.
 */
export async function isVercelPreviewDeployment(url: string): Promise<boolean> {
  if (!isVercelHost(url)) return false;
  const origin = new URL(url).origin;
  for (let attempt = 0; attempt < PREVIEW_CHECK_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(origin, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(PREVIEW_CHECK_TIMEOUT_MS),
      });
      return (res.headers.get('x-robots-tag')?.toLowerCase() ?? '').includes(
        'noindex'
      );
    } catch {
      // Timeout / network error — retry once (the first hit may have woken a
      // cold preview), then fail open so a transient blip never blocks a
      // legitimate production origin.
    }
  }
  return false;
}
